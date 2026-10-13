import { normalizeHeader } from './cells';
import type { ColumnMapping, CsvTable, Doubt } from './types';

export type ColumnRole = 'date' | 'label' | 'amount' | 'debit' | 'credit';

export type Question =
  | { kind: 'amountShape' }
  | { kind: 'column'; role: ColumnRole }
  | { kind: 'dateOrder'; sample: string };

/** Première date du fichier qui se lit dans les deux sens (06/07 : 6 juillet ou 7 juin). */
function ambiguousDate(table: CsvTable, mapping: ColumnMapping): string | null {
  if (mapping.date === null) return null;
  for (const row of table.rows) {
    const value = (row[mapping.date] ?? '').trim();
    const match = /^(\d{1,2})[/.-](\d{1,2})[/.-]\d{2,4}$/.exec(value);
    if (match && Number(match[1]) <= 12 && Number(match[2]) <= 12 && match[1] !== match[2]) return value;
  }
  return null;
}

/**
 * Les questions à poser, dans l'ordre, d'après les doutes. Elles sont recalculées après chaque réponse :
 * répondre « deux colonnes » fait apparaître les questions débit et crédit.
 */
export function buildQuestions(doubts: Doubt[], mapping: ColumnMapping, table: CsvTable): Question[] {
  const checkAll = doubts.includes('illisibles');
  const questions: Question[] = [];

  if (checkAll || doubts.includes('date')) questions.push({ kind: 'column', role: 'date' });
  if (checkAll || doubts.includes('libelle')) questions.push({ kind: 'column', role: 'label' });
  if (checkAll || doubts.includes('montant')) {
    questions.push({ kind: 'amountShape' });
    if (mapping.amount.kind === 'split') {
      questions.push({ kind: 'column', role: 'debit' }, { kind: 'column', role: 'credit' });
    } else {
      questions.push({ kind: 'column', role: 'amount' });
    }
  }
  if (doubts.includes('ordreDate')) {
    const sample = ambiguousDate(table, mapping);
    if (sample) questions.push({ kind: 'dateOrder', sample });
  }
  return questions;
}

/** Colonne actuellement associée à un rôle. */
export function columnFor(mapping: ColumnMapping, role: ColumnRole): number | null {
  if (role === 'date') return mapping.date;
  if (role === 'label') return mapping.label;
  if (mapping.amount.kind === 'single') return role === 'amount' ? mapping.amount.column : null;
  if (role === 'debit') return mapping.amount.debit;
  if (role === 'credit') return mapping.amount.credit;
  return null;
}

const free = (value: number | null, column: number) => (value === column ? null : value);

/** La colonne choisie prend ce rôle et quitte tout autre rôle. */
export function answerColumn(mapping: ColumnMapping, role: ColumnRole, column: number): ColumnMapping {
  const amount =
    mapping.amount.kind === 'single'
      ? { kind: 'single' as const, column: free(mapping.amount.column, column) }
      : { kind: 'split' as const, debit: free(mapping.amount.debit, column), credit: free(mapping.amount.credit, column) };
  const next: ColumnMapping = {
    ...mapping,
    date: free(mapping.date, column),
    label: free(mapping.label, column),
    detail: free(mapping.detail, column),
    amount,
  };

  if (role === 'date') return { ...next, date: column };
  if (role === 'label') return { ...next, label: column };
  if (role === 'amount') return { ...next, amount: { kind: 'single', column } };
  const split = next.amount.kind === 'split' ? next.amount : { kind: 'split' as const, debit: null, credit: null };
  return { ...next, amount: { ...split, [role]: column } };
}

export function answerAmountShape(mapping: ColumnMapping, shape: 'single' | 'split'): ColumnMapping {
  if (mapping.amount.kind === shape) return mapping;
  if (mapping.amount.kind === 'split') {
    return { ...mapping, amount: { kind: 'single', column: mapping.amount.debit ?? mapping.amount.credit } };
  }
  return { ...mapping, amount: { kind: 'split', debit: mapping.amount.column, credit: null } };
}

export function answerDateOrder(mapping: ColumnMapping, order: 'dmy' | 'mdy'): ColumnMapping {
  return { ...mapping, dateOrder: order };
}

const AMOUNT_ROLES: ColumnRole[] = ['amount', 'debit', 'credit'];

/** Colonnes cliquables pour un rôle : un solde n'est jamais proposé comme montant. */
export function selectableColumns(table: CsvTable, role: ColumnRole): number[] {
  return table.headers
    .map((header, index) => ({ header: normalizeHeader(header), index }))
    .filter(({ header }) => !AMOUNT_ROLES.includes(role) || !/solde|balance/.test(header))
    .map(({ index }) => index);
}

/** Ce qui manque encore pour importer, en mots simples. */
export function missingParts(mapping: ColumnMapping): string[] {
  const missing: string[] = [];
  if (mapping.date === null) missing.push('la date');
  if (mapping.label === null) missing.push('le libellé');
  const hasAmount =
    mapping.amount.kind === 'single'
      ? mapping.amount.column !== null
      : mapping.amount.debit !== null || mapping.amount.credit !== null;
  if (!hasAmount) missing.push('le montant');
  return missing;
}

const REASONS: [Doubt, string][] = [
  ['illisibles', 'Certaines lignes n’ont pas pu être lues.'],
  ['date', 'On n’a pas trouvé la colonne de la date.'],
  ['montant', 'On n’est pas sûrs de la colonne du montant.'],
  ['libelle', 'On n’a pas trouvé la colonne du libellé.'],
  ['ordreDate', 'On n’est pas sûrs du sens des dates (jour et mois).'],
];

/** La phrase du bandeau : pourquoi on pose des questions. */
export function doubtReason(doubts: Doubt[]): string {
  const reason = REASONS.find(([doubt]) => doubts.includes(doubt))?.[1] ?? 'On préfère vérifier avec toi.';
  return `${reason} Quelques petites questions et c’est fini.`;
}
