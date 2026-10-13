import { compactAmount } from './cells';
import type { ColumnMapping, CsvTable, StatementLine } from './types';

/** Montant d'une case, avec la décimale du fichier ; les autres séparateurs sont des milliers. */
export function parseAmount(value: string, decimal: ',' | '.'): number | null {
  const thousands = decimal === ',' ? /[.']/g : /[,']/g;
  const normalized = compactAmount(value).replace(thousands, '').replace(',', '.');
  if (!/^[-+]?\d+(?:\.\d+)?$/.test(normalized)) return null;
  return Number(normalized);
}

const pad = (value: number) => String(value).padStart(2, '0');

/** Date en jj/mm/aaaa, ou null si la case n'est pas une date réelle. */
export function normalizeDate(value: string, order: 'dmy' | 'mdy'): string | null {
  const cell = value.trim();
  let day: number;
  let month: number;
  let year: number;

  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(cell);
  const short = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2}|\d{4})$/.exec(cell);
  if (iso) {
    [year, month, day] = [Number(iso[1]), Number(iso[2]), Number(iso[3])];
  } else if (short) {
    const [first, second] = [Number(short[1]), Number(short[2])];
    [day, month] = order === 'dmy' ? [first, second] : [second, first];
    year = Number(short[3]) + (short[3].length === 2 ? 2000 : 0);
  } else {
    return null;
  }

  const date = new Date(Date.UTC(year, month - 1, day));
  const exists = date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  return exists ? `${pad(day)}/${pad(month)}/${year}` : null;
}

function amountOf(row: string[], mapping: ColumnMapping): number | null {
  const read = (column: number | null) => (column === null ? null : parseAmount(row[column] ?? '', mapping.decimal));
  if (mapping.amount.kind === 'single') return read(mapping.amount.column);

  const debit = read(mapping.amount.debit);
  const credit = read(mapping.amount.credit);
  if (debit === null && credit === null) return null;
  return Math.abs(credit ?? 0) - Math.abs(debit ?? 0);
}

/** Les opérations du tableau selon l'association choisie ; les lignes sans date, libellé ou montant sont comptées à part. */
export function applyMapping(table: CsvTable, mapping: ColumnMapping): { lines: StatementLine[]; unreadable: number } {
  const lines: StatementLine[] = [];
  let unreadable = 0;

  for (const row of table.rows) {
    const date = mapping.date === null ? null : normalizeDate(row[mapping.date] ?? '', mapping.dateOrder);
    const detail = mapping.detail === null ? '' : (row[mapping.detail] ?? '').trim();
    // Case libellé vide sur une ligne, détail rempli (cela arrive à la Société Générale) : le détail sert de libellé.
    const label = mapping.label === null ? '' : (row[mapping.label] ?? '').trim() || detail;
    const amount = amountOf(row, mapping);
    if (!date || !label || amount === null) {
      unreadable++;
      continue;
    }
    lines.push({ date, label, detail, amount });
  }

  return { lines, unreadable };
}
