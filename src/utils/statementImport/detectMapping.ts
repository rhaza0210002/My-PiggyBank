import { compactAmount, isAmountCell, isDateCell, normalizeHeader } from './cells';
import type { AmountColumns, ColumnMapping, CsvTable, Doubt } from './types';

/** Part minimale de cases non vides qui doivent être des dates pour qu'une colonne soit « la date ». */
const DATE_SHARE = 0.9;
const AMOUNT_SHARE = 0.9;

interface ColumnProfile {
  index: number;
  header: string;
  values: string[];
  dateShare: number;
  amountShare: number;
  distinct: number;
}

const has = (header: string, words: string[]) => words.some((word) => header.includes(word));

const BALANCE = ['solde', 'balance'];
const DEBIT = ['debit', 'sortie', 'depense'];
const CREDIT = ['credit', 'entree', 'recette'];
const AMOUNT = ['montant', 'amount'];
const CURRENCY = ['devise', 'currency'];

function profile(table: CsvTable, index: number): ColumnProfile {
  const values = table.rows.map((row) => row[index] ?? '').filter((value) => value.trim() !== '');
  const share = (test: (value: string) => boolean) => (values.length ? values.filter(test).length / values.length : 0);
  return {
    index,
    header: normalizeHeader(table.hasHeader ? table.headers[index] : ''),
    values,
    dateShare: share(isDateCell),
    amountShare: share(isAmountCell),
    distinct: new Set(values).size,
  };
}

const isCurrency = (column: ColumnProfile) =>
  has(column.header, CURRENCY) || (column.values.length > 0 && column.values.every((value) => /^[A-Z]{3}$/.test(value.trim())));

function pickDate(columns: ColumnProfile[]): ColumnProfile | null {
  const dates = columns.filter((column) => column.values.length > 0 && column.dateShare >= DATE_SHARE);
  return (
    dates.find((column) => column.header.includes('ope')) ??
    dates.find((column) => !column.header.includes('valeur')) ??
    dates[0] ??
    null
  );
}

const negativeShare = (column: ColumnProfile) =>
  column.values.filter((value) => compactAmount(value).startsWith('-')).length / column.values.length;

/** Montant unique ou débit/crédit, et s'il reste un doute. */
function pickAmount(candidates: ColumnProfile[]): { amount: AmountColumns; doubt: boolean } {
  const debit = candidates.find((column) => has(column.header, DEBIT));
  const credit = candidates.find((column) => has(column.header, CREDIT));
  if (debit && credit && debit !== credit) {
    return { amount: { kind: 'split', debit: debit.index, credit: credit.index }, doubt: false };
  }

  if (candidates.length === 0) return { amount: { kind: 'single', column: null }, doubt: true };
  if (candidates.length === 1) return { amount: { kind: 'single', column: candidates[0].index }, doubt: false };

  const named = candidates.filter((column) => has(column.header, AMOUNT));
  if (named.length === 1) return { amount: { kind: 'single', column: named[0].index }, doubt: false };

  // Plusieurs colonnes possibles : supposition par le signe (sorties surtout négatives, entrées surtout positives).
  const [first, second] = candidates;
  const outgoing = [first, second].find((column) => negativeShare(column) > 0.5);
  const incoming = [first, second].find((column) => negativeShare(column) < 0.5);
  if (outgoing && incoming && outgoing !== incoming) {
    return { amount: { kind: 'split', debit: outgoing.index, credit: incoming.index }, doubt: true };
  }
  return { amount: { kind: 'single', column: first.index }, doubt: true };
}

function pickDecimal(values: string[]): ',' | '.' {
  const compact = values.map(compactAmount);
  if (compact.some((value) => /,\d{1,2}$/.test(value))) return ',';
  if (compact.some((value) => /\.\d{1,2}$/.test(value))) return '.';
  return ',';
}

/** Nombre de mois différents si on lit les dates dans cet ordre (un relevé couvre peu de mois). */
function monthSpread(pairs: [number, number][], order: 'dmy' | 'mdy'): number {
  return new Set(pairs.map(([first, second]) => (order === 'dmy' ? second : first))).size;
}

function pickDateOrder(values: string[]): { order: 'dmy' | 'mdy'; doubt: boolean } {
  const pairs = values
    .map((value) => /^(\d{1,2})[/.-](\d{1,2})[/.-]\d{2,4}$/.exec(value.trim()))
    .filter((match): match is RegExpExecArray => match !== null)
    .map((match): [number, number] => [Number(match[1]), Number(match[2])]);

  if (pairs.some(([first]) => first > 12)) return { order: 'dmy', doubt: false };
  if (pairs.some(([, second]) => second > 12)) return { order: 'mdy', doubt: false };
  if (!pairs.some(([first, second]) => first !== second)) return { order: 'dmy', doubt: false };

  // Sans preuve, l'ordre qui regroupe les opérations sur le moins de mois est le bon ; à égalité, on demande.
  const dmy = monthSpread(pairs, 'dmy');
  const mdy = monthSpread(pairs, 'mdy');
  if (dmy !== mdy) return { order: dmy < mdy ? 'dmy' : 'mdy', doubt: false };
  return { order: 'dmy', doubt: true };
}

/**
 * Supposition sur le rôle de chaque colonne, d'après leur contenu (les en-têtes ne servent qu'à départager),
 * et la liste des doutes qui justifient de poser des questions.
 */
export function detectMapping(table: CsvTable): { mapping: ColumnMapping; doubts: Doubt[] } {
  const columns = table.headers.map((_, index) => profile(table, index));
  const doubts: Doubt[] = [];

  const date = pickDate(columns);
  const usable = columns.filter(
    (column) => column !== date && !has(column.header, BALANCE) && !isCurrency(column) && column.values.length > 0,
  );

  const amountCandidates = usable.filter((column) => column.amountShare >= AMOUNT_SHARE);
  const { amount, doubt: amountDoubt } = pickAmount(amountCandidates);

  const texts = usable.filter(
    (column) => !amountCandidates.includes(column) && column.amountShare < 0.5 && column.dateShare < 0.5,
  );
  const detailByName = texts.find((column) => column.header.includes('detail'));
  const label = [...texts.filter((column) => column !== detailByName)].sort((a, b) => b.distinct - a.distinct)[0] ?? detailByName ?? null;
  const detail = detailByName && detailByName !== label ? detailByName : (texts.find((column) => column !== label) ?? null);

  const dateOrder = pickDateOrder(date ? date.values : []);
  const amountValues = amountCandidates.flatMap((column) => column.values);

  if (!date) doubts.push('date');
  if (amountDoubt) doubts.push('montant');
  if (!label) doubts.push('libelle');
  if (dateOrder.doubt) doubts.push('ordreDate');

  return {
    mapping: {
      date: date?.index ?? null,
      label: label?.index ?? null,
      detail: detail?.index ?? null,
      amount,
      decimal: pickDecimal(amountValues),
      dateOrder: dateOrder.order,
    },
    doubts,
  };
}
