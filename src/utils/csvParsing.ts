export function normalizeCsvCell(value: string): string {
  return value.trim().replace(/^"|"$/g, "").replace(/""/g, '"');
}

export function getCsvSeparator(line: string): string {
  if (line.includes(";")) return ";";
  if (line.includes(",")) return ",";
  return "\t";
}

function normalizeHeader(value: string): string {
  return normalizeCsvCell(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

export function getCsvColumnIndex(headers: string[], candidates: string[]): number {
  const normalizedCandidates = candidates.map(normalizeHeader);

  return headers.findIndex((header) => {
    const normalizedHeader = normalizeHeader(header);
    return normalizedCandidates.some((candidate) =>
      normalizedHeader.includes(candidate),
    );
  });
}

export function isCsvDateCell(value: string): boolean {
  const normalized = normalizeCsvCell(value);
  return (
    /^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}$/.test(normalized) ||
    /^\d{4}-\d{2}-\d{2}$/.test(normalized)
  );
}

function normalizeAmount(value: string): string {
  return normalizeCsvCell(value)
    .replace(/€|\s/g, "")
    .replace(/\u00a0/g, "")
    .replace(/^\((.*)\)$/, "-$1");
}

export function isCsvAmountCell(value: string): boolean {
  const normalized = normalizeAmount(value);
  return (
    /^[-+]?\d{1,3}(?:[\s.]\d{3})*(?:,\d+)?$/.test(normalized) ||
    /^[-+]?\d+(?:,\d+)?$/.test(normalized)
  );
}

export function parseCsvAmount(value: string): number | null {
  const normalized = normalizeAmount(value)
    .replace(/\./g, "")
    .replace(",", ".");

  if (!normalized || normalized === "-" || normalized === "+") return null;

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Convertit une date de relevé (jj/mm/aaaa, jj-mm-aa ou aaaa-mm-jj) en date ISO (aaaa-mm-jj).
 * Retourne null si la date n'existe pas.
 */
export function toIsoDate(value: string): string | null {
  const normalized = normalizeCsvCell(value);
  let year: number;
  let month: number;
  let day: number;

  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(normalized);
  const french = /^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/.exec(normalized);

  if (iso) {
    [year, month, day] = [Number(iso[1]), Number(iso[2]), Number(iso[3])];
  } else if (french) {
    [day, month] = [Number(french[1]), Number(french[2])];
    year = Number(french[3]);
    if (french[3].length === 2) year += 2000;
  } else {
    return null;
  }

  const date = new Date(Date.UTC(year, month - 1, day));
  const isRealDate =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;
  if (!isRealDate) return null;

  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
