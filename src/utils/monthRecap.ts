export interface RecapTransaction {
  category_id: string | null;
  amount: number | string;
}

export interface RecapBudgetEntry {
  category_id: string;
  month_index: number;
  amount: number | string;
}

export interface RecapCategory {
  id: string;
  label: string;
}

export interface MonthRecap {
  operations: number;
  /** Catégories qui avaient un budget (> 0) ce mois-ci. */
  budgetedCount: number;
  /** Parmi elles, celles dont les dépenses sont restées dans le budget. */
  withinBudgetCount: number;
  /** Catégories où les dépenses ont dépassé le budget, pour les regarder sans dramatiser. */
  overBudget: Array<{ label: string; spent: number; budget: number }>;
  /** Catégorie où il s'est le plus dépensé. */
  topCategory: { label: string; spent: number } | null;
}

/** Résumé bienveillant d'un mois bouclé : ce qui a tenu, ce qui est à regarder, rien de culpabilisant. */
export function buildMonthRecap(
  transactions: readonly RecapTransaction[],
  budgetEntries: readonly RecapBudgetEntry[],
  categories: readonly RecapCategory[],
  monthIndex: number,
): MonthRecap {
  const budgetByCategory = new Map<string, number>();
  for (const entry of budgetEntries) {
    if (entry.month_index !== monthIndex) continue;
    budgetByCategory.set(entry.category_id, (budgetByCategory.get(entry.category_id) ?? 0) + Number(entry.amount));
  }

  const spentByCategory = new Map<string, number>();
  for (const transaction of transactions) {
    const amount = Number(transaction.amount);
    if (!transaction.category_id || amount >= 0) continue;
    spentByCategory.set(transaction.category_id, (spentByCategory.get(transaction.category_id) ?? 0) - amount);
  }

  const labelOf = new Map(categories.map((category) => [category.id, category.label]));
  let budgetedCount = 0;
  let withinBudgetCount = 0;
  const overBudget: MonthRecap['overBudget'] = [];

  for (const [categoryId, budget] of budgetByCategory) {
    if (budget <= 0) continue;
    budgetedCount += 1;
    const spent = spentByCategory.get(categoryId) ?? 0;
    if (spent > budget) overBudget.push({ label: labelOf.get(categoryId) ?? 'Catégorie', spent, budget });
    else withinBudgetCount += 1;
  }

  const [topId, topSpent] = [...spentByCategory].sort((a, b) => b[1] - a[1])[0] ?? [];
  return {
    operations: transactions.length,
    budgetedCount,
    withinBudgetCount,
    overBudget: overBudget.sort((a, b) => b.spent - b.budget - (a.spent - a.budget)),
    topCategory: topId ? { label: labelOf.get(topId) ?? 'Catégorie', spent: topSpent } : null,
  };
}
