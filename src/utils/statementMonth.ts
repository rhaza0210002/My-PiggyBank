import { toIsoDate } from '@/utils/csvParsing';

/** Mois le plus présent dans un relevé (à égalité, le plus récent) : c'est lui qu'on compare au budget. */
export function statementMonth(dates: readonly string[]): { year: number; monthIndex: number } | null {
  const counts = new Map<string, number>();
  for (const date of dates) {
    const iso = toIsoDate(date);
    if (iso) counts.set(iso.slice(0, 7), (counts.get(iso.slice(0, 7)) ?? 0) + 1);
  }
  let best: string | null = null;
  for (const [key, count] of counts) {
    const bestCount = best ? counts.get(best)! : 0;
    if (count > bestCount || (count === bestCount && best !== null && key > best)) best = key;
  }
  return best ? { year: Number(best.slice(0, 4)), monthIndex: Number(best.slice(5, 7)) - 1 } : null;
}
