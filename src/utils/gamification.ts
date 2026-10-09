/**
 * Récompenses du pointage. Tout est DÉRIVÉ des opérations déjà pointées : rien n'est stocké, donc
 * rien ne peut se perdre. Un mois manqué n'enlève jamais de points ni de niveau ; il devient « à
 * rattraper » et le terminer plus tard rapporte même un bonus.
 */

export interface ActivityRow {
  booked_on: string;
  reconciled_at: string | null;
}

export type MonthStatus = 'complete' | 'in-progress' | 'catch-up' | 'empty' | 'future';

export interface MonthProgress {
  monthIndex: number;
  total: number;
  done: number;
  status: MonthStatus;
}

export const XP_PER_OPERATION = 10;
export const XP_PER_COMPLETE_MONTH = 100;
export const XP_CATCH_UP_BONUS = 50;

export interface Badge {
  id: string;
  label: string;
  description: string;
  earned: boolean;
}

export interface LevelInfo {
  level: number;
  title: string;
  xp: number;
  /** XP déjà gagnés dans le niveau en cours. */
  xpIntoLevel: number;
  /** XP nécessaires pour passer au niveau suivant. */
  xpForNext: number;
}

export interface Gamification {
  months: MonthProgress[];
  currentMonth: MonthProgress;
  completedMonths: number;
  caughtUpMonths: number;
  reconciledOperations: number;
  xp: number;
  levelInfo: LevelInfo;
  /** Jours où au moins une opération a été pointée, sur les 7 derniers jours (aujourd'hui compris). */
  activeDaysLast7: number;
  /** Opérations pointées aujourd'hui (jour local) : le niveau de la tirelire. */
  pointedToday: number;
  badges: Badge[];
}

const LEVEL_TITLES = [
  'Petit cochon',
  'Cochon curieux',
  'Cochon organisé',
  'Tirelire en route',
  'Tirelire dorée',
  'Trésorier malin',
  'Maître des comptes',
];

/** Niveau n atteint à 50 × (n-1)² XP : rapide au début, pour récompenser vite. */
function xpToReach(level: number): number {
  return 50 * (level - 1) ** 2;
}

export function getLevelInfo(xp: number): LevelInfo {
  let level = 1;
  while (xp >= xpToReach(level + 1)) level += 1;

  const floor = xpToReach(level);
  return {
    level,
    title: LEVEL_TITLES[Math.min(level, LEVEL_TITLES.length) - 1],
    xp,
    xpIntoLevel: xp - floor,
    xpForNext: xpToReach(level + 1) - floor,
  };
}

function monthStatus(
  total: number,
  done: number,
  monthIndex: number,
  currentMonthIndex: number,
): MonthStatus {
  if (monthIndex > currentMonthIndex) return 'future';
  if (total === 0) return 'empty';
  if (done === total) return 'complete';
  return monthIndex < currentMonthIndex ? 'catch-up' : 'in-progress';
}

const DAY_MS = 24 * 60 * 60 * 1000;

function localDayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

/**
 * Régularité douce : combien de jours distincts, sur les 7 derniers, ont vu au moins un pointage.
 * Volontairement pas une « série » qui se brise : un jour manqué ne fait rien perdre.
 */
export function countActiveDays(rows: readonly ActivityRow[], now: Date): number {
  const wanted = new Set(Array.from({ length: 7 }, (_, offset) => localDayKey(new Date(now.getTime() - offset * DAY_MS))));
  const active = new Set<string>();

  rows.forEach((row) => {
    if (!row.reconciled_at) return;
    const key = localDayKey(new Date(row.reconciled_at));
    if (wanted.has(key)) active.add(key);
  });

  return active.size;
}

/** Opérations pointées pendant le jour local de `day` (alimente la tirelire du jour). */
export function countPointedOn(rows: readonly ActivityRow[], day: Date): number {
  const wanted = localDayKey(day);
  return rows.filter((row) => row.reconciled_at !== null && localDayKey(new Date(row.reconciled_at)) === wanted).length;
}

export function computeGamification(rows: readonly ActivityRow[], now: Date): Gamification {
  const year = now.getFullYear();
  const currentMonthIndex = now.getMonth();

  const totals = new Map<number, { total: number; done: number }>();
  let reconciledOperations = 0;
  // Mois complétés alors qu'ils étaient terminés : récompense de rattrapage.
  let caughtUpMonths = 0;
  let completeMonthsAllTime = 0;

  const perYearMonth = new Map<string, { total: number; done: number; year: number; month: number }>();

  rows.forEach((row) => {
    const rowYear = Number(row.booked_on.slice(0, 4));
    const month = Number(row.booked_on.slice(5, 7)) - 1;
    const key = `${rowYear}-${month}`;
    const bucket = perYearMonth.get(key) ?? { total: 0, done: 0, year: rowYear, month };
    bucket.total += 1;
    if (row.reconciled_at) {
      bucket.done += 1;
      reconciledOperations += 1;
    }
    perYearMonth.set(key, bucket);

    if (rowYear === year) {
      const yearBucket = totals.get(month) ?? { total: 0, done: 0 };
      yearBucket.total += 1;
      if (row.reconciled_at) yearBucket.done += 1;
      totals.set(month, yearBucket);
    }
  });

  perYearMonth.forEach((bucket) => {
    if (bucket.total > 0 && bucket.done === bucket.total) {
      completeMonthsAllTime += 1;
      const isPast = bucket.year < year || (bucket.year === year && bucket.month < currentMonthIndex);
      if (isPast) caughtUpMonths += 1;
    }
  });

  const months: MonthProgress[] = Array.from({ length: 12 }, (_, monthIndex) => {
    const { total = 0, done = 0 } = totals.get(monthIndex) ?? {};
    return { monthIndex, total, done, status: monthStatus(total, done, monthIndex, currentMonthIndex) };
  });

  const xp =
    reconciledOperations * XP_PER_OPERATION +
    completeMonthsAllTime * XP_PER_COMPLETE_MONTH +
    caughtUpMonths * XP_CATCH_UP_BONUS;

  const badge = (id: string, label: string, description: string, earned: boolean): Badge => ({
    id,
    label,
    description,
    earned,
  });

  return {
    months,
    currentMonth: months[currentMonthIndex],
    completedMonths: completeMonthsAllTime,
    caughtUpMonths,
    reconciledOperations,
    xp,
    levelInfo: getLevelInfo(xp),
    activeDaysLast7: countActiveDays(rows, now),
    pointedToday: countPointedOn(rows, now),
    badges: [
      badge('first-operation', 'Premier pas', 'Pointer une première opération', reconciledOperations >= 1),
      badge('ten-operations', 'Dix pointages', 'Pointer 10 opérations', reconciledOperations >= 10),
      badge('hundred-operations', 'Centurion', 'Pointer 100 opérations', reconciledOperations >= 100),
      badge('first-month', 'Mois bouclé', 'Pointer toutes les opérations d’un mois', completeMonthsAllTime >= 1),
      badge('catch-up', 'Rattrapage réussi', 'Terminer un mois passé', caughtUpMonths >= 1),
      badge('three-months', 'Trois mois', 'Boucler 3 mois', completeMonthsAllTime >= 3),
      badge('six-months', 'Semestre', 'Boucler 6 mois', completeMonthsAllTime >= 6),
      badge('twelve-months', 'Une année', 'Boucler 12 mois', completeMonthsAllTime >= 12),
    ],
  };
}
