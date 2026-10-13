/** Reconnaissance du contenu d'une case de relevé : date, montant, en-tête. */

const DATE_PATTERNS = [/^\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}$/, /^\d{4}-\d{2}-\d{2}$/];

export function isDateCell(value: string): boolean {
  const cell = value.trim();
  return DATE_PATTERNS.some((pattern) => pattern.test(cell));
}

/** Retire monnaie, espaces (dont insécables) et parenthèses comptables (qui deviennent un signe moins). */
export function compactAmount(value: string): string {
  const cell = value.trim().replace(/€|EUR/gi, '').replace(/[\s  ]/g, '');
  const accounting = /^\((.*)\)$/.exec(cell);
  return accounting ? `-${accounting[1]}` : cell;
}

const AMOUNT_PATTERN = /^[-+]?(?:\d{1,3}(?:[.,']\d{3})+|\d+)(?:[.,]\d{1,2})?$/;

export function isAmountCell(value: string): boolean {
  const cell = compactAmount(value);
  return cell !== '' && AMOUNT_PATTERN.test(cell);
}

/** En-tête comparable : minuscules, sans accents ni ponctuation. */
export function normalizeHeader(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}
