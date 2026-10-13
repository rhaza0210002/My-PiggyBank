import { isAmountCell, isDateCell } from './cells';
import type { CsvTable } from './types';

const SEPARATORS = [';', ',', '\t', '|'];
const MIN_COLUMNS = 3;
/** Lignes régulières qui doivent suivre la première opération pour qu'on y voie le début du tableau. */
const CONFIRMING_ROWS = 2;

/** Découpage CSV standard : séparateur et retours à la ligne entre guillemets gardés, « "" » vaut « " ». */
export function splitCsvRecords(text: string, separator: string): string[][] {
  const records: string[][] = [];
  let record: string[] = [];
  let cell = '';
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
    } else if (char === '"' && cell.trim() === '') {
      cell = '';
      quoted = true;
    } else if (char === separator) {
      record.push(cell.trim());
      cell = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i++;
      record.push(cell.trim());
      records.push(record);
      record = [];
      cell = '';
    } else {
      cell += char;
    }
  }
  record.push(cell.trim());
  records.push(record);

  return records.filter((row) => row.some((value) => value !== ''));
}

/** Plus longue suite de lignes consécutives de même largeur (au moins 3 colonnes). */
function longestRegularRun(records: string[][]): number {
  let best = 0;
  let run = 0;
  records.forEach((record, index) => {
    const sameAsPrevious = index > 0 && record.length === records[index - 1].length;
    run = record.length >= MIN_COLUMNS ? (sameAsPrevious ? run + 1 : 1) : 0;
    best = Math.max(best, run);
  });
  return best;
}

const hasDate = (record: string[]) => record.some(isDateCell);

/**
 * Certaines banques finissent chaque opération par un séparateur, mais pas l'en-tête : une dernière case vide
 * en trop. On la retire des lignes d'opérations pour qu'elles aient la largeur de l'en-tête.
 */
function dropTrailingEmptyColumn(records: string[][]): string[][] {
  const withDate = records.filter(hasDate);
  if (withDate.length === 0) return records;
  const width = withDate[0].length;
  const trailingEmpty = withDate.every((record) => record.length === width && record[width - 1] === '');
  const headerAbove = records.some((record) => record.length === width - 1 && !hasDate(record));
  if (!trailingEmpty || !headerAbove) return records;
  return records.map((record) => (record.length === width && hasDate(record) ? record.slice(0, -1) : record));
}

/** Première ligne d'opération : elle contient une date et les suivantes, de même largeur, aussi. */
function findTableStart(records: string[][]): number {
  return records.findIndex((record, index) => {
    if (record.length < MIN_COLUMNS || !hasDate(record)) return false;
    const following = records.slice(index + 1, index + 1 + CONFIRMING_ROWS);
    return following.every((next) => next.length === record.length && hasDate(next));
  });
}

/**
 * Le tableau des opérations d'un CSV de banque : séparateur deviné, lignes de compte au-dessus sautées,
 * lignes de largeur différente (total, solde final) écartées. Null si aucun tableau n'est trouvé.
 */
export function readCsvTable(text: string): CsvTable | null {
  let best: { separator: string; records: string[][]; run: number } | null = null;
  for (const separator of SEPARATORS) {
    const records = splitCsvRecords(text, separator);
    const run = longestRegularRun(records);
    if (run > 0 && (!best || run > best.run)) best = { separator, records, run };
  }
  if (!best) return null;

  const { separator } = best;
  const records = dropTrailingEmptyColumn(best.records);
  const start = findTableStart(records);
  if (start === -1) return null;

  const width = records[start].length;
  const previous = records[start - 1];
  const hasHeader =
    previous !== undefined &&
    previous.length === width &&
    !previous.some((value) => isDateCell(value) || isAmountCell(value));

  return {
    separator,
    hasHeader,
    headers: hasHeader ? previous : Array.from({ length: width }, (_, index) => `Colonne ${index + 1}`),
    rows: records.slice(start).filter((record) => record.length === width),
  };
}
