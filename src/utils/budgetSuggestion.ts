import type { DataGroup } from '@/types/budget';

export interface SuggestionTransaction {
  amount: number;
  category_id: string | null;
}

export interface BudgetSuggestion {
  groupKey: string;
  category: string;
  amount: number;
}

function isEmpty(value: number | string | undefined): boolean {
  return value === undefined || value === '-' || value === '';
}

/**
 * Propose un montant par catégorie à partir de ce qui a vraiment été dépensé (ou reçu) : rien n'est
 * inventé. Seules les lignes encore vides pour le mois sont remplies, jamais celles que
 * l'utilisateur a déjà saisies. Montants arrondis à l'euro, toujours positifs (le groupe dit le sens).
 */
export function suggestBudgetAmounts(
  transactions: SuggestionTransaction[],
  dataGroups: DataGroup[],
  monthIndex: number,
): BudgetSuggestion[] {
  const totals = new Map<string, number>();
  transactions.forEach((transaction) => {
    if (!transaction.category_id) return;
    totals.set(transaction.category_id, (totals.get(transaction.category_id) ?? 0) + transaction.amount);
  });

  return dataGroups.flatMap((group) =>
    group.rows.flatMap((row) => {
      if (!row.categoryId || !isEmpty(row.values[monthIndex])) return [];
      const amount = Math.round(Math.abs(totals.get(row.categoryId) ?? 0));
      return amount > 0 ? [{ groupKey: group.key, category: row.category, amount }] : [];
    }),
  );
}
