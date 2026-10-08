import type { BudgetEntry } from '@/services/budgetService';
import type { Category, CategoryGroup } from '@/services/transactionCategoryService';
import type { StoredTransaction } from '@/services/transactionService';
import { isIncomeGroup } from '@/utils/budgetComparison';

export interface BudgetVsActualSlice {
  categoryId: string;
  label: string;
  groupTitle: string;
  /** Budget estimé du mois (toujours positif). */
  budget: number;
  /** Dépense réelle du mois (positive ; les remboursements viennent en déduction). */
  actual: number;
}

/**
 * Une ligne par catégorie de dépense (hors « Revenus ») ayant un budget ou une dépense réelle ce mois-ci.
 * L'ordre suit celui des groupes puis des catégories, pour que les couleurs restent stables d'un mois à l'autre.
 */
export function buildBudgetVsActualSlices(
  monthIndex: number,
  budgetEntries: readonly BudgetEntry[],
  transactions: readonly StoredTransaction[],
  categories: readonly Category[],
  categoryGroups: readonly CategoryGroup[],
): BudgetVsActualSlice[] {
  const budgetByCategory = new Map<string, number>();
  budgetEntries
    .filter((entry) => entry.month_index === monthIndex)
    .forEach((entry) => {
      budgetByCategory.set(
        entry.category_id,
        (budgetByCategory.get(entry.category_id) ?? 0) + Number(entry.amount),
      );
    });

  const actualByCategory = new Map<string, number>();
  transactions.forEach((transaction) => {
    if (!transaction.category_id) return;
    actualByCategory.set(
      transaction.category_id,
      (actualByCategory.get(transaction.category_id) ?? 0) - Number(transaction.amount),
    );
  });

  return [...categoryGroups]
    .sort((first, second) => first.id - second.id)
    .filter((group) => !isIncomeGroup(group))
    .flatMap((group) =>
      categories
        .filter((category) => category.cat_group_key === group.id)
        .sort((first, second) => first.label.localeCompare(second.label, 'fr'))
        .map((category): BudgetVsActualSlice => ({
          categoryId: category.id,
          label: category.label,
          groupTitle: group.libelle,
          budget: Math.max(0, budgetByCategory.get(category.id) ?? 0),
          actual: Math.max(0, actualByCategory.get(category.id) ?? 0),
        }))
        .filter((slice) => slice.budget > 0 || slice.actual > 0),
    );
}
