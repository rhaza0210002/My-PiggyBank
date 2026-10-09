/** Objectif du jour par défaut : une tirelire pleine à 10 pointages. */
export const DAILY_GOAL = 10;

/** Niveau de remplissage de la tirelire, de 0 (vide) à 1 (pleine) ; jamais au-delà, jamais négatif. */
export function tirelireLevel(pointed: number, goal: number = DAILY_GOAL): number {
  if (goal <= 0) return 0;
  return Math.min(1, Math.max(0, pointed / goal));
}
