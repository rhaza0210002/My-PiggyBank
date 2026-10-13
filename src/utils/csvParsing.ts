/**
 * Convertit une date de relevé (jj/mm/aaaa, jj-mm-aa ou aaaa-mm-jj) en date ISO (aaaa-mm-jj).
 * Retourne null si la date n'existe pas.
 */
export function toIsoDate(value: string): string | null {
  const normalized = value.trim().replace(/^"|"$/g, '');
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