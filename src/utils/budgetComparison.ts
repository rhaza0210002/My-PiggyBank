/** Les budgets sont saisis en positif ; seul le groupe « Revenus » correspond à des entrées d'argent. */
export function isIncomeGroup(group: { label?: string | null; libelle?: string | null }): boolean {
  return `${group.label ?? ''} ${group.libelle ?? ''}`.toLowerCase().includes('revenu');
}

/** Écart favorable = positif : plus de revenus que prévu, ou moins de dépenses que prévu. */
export function getDifference(isIncome: boolean, budget: number, actual: number): number {
  return isIncome ? actual - budget : budget - Math.abs(actual);
}
