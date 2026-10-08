import type { Category, CategoryGroup } from '@/services/transactionCategoryService';
import type { StoredTransaction } from '@/services/transactionService';

export interface CategoryBreakdown {
  categoryId: string;
  label: string;
  total: number;
  transactions: StoredTransaction[];
}

export interface GroupBreakdown {
  id: number;
  key: string;
  title: string;
  total: number;
  categories: CategoryBreakdown[];
}

export interface MonthBreakdown {
  groups: GroupBreakdown[];
  uncategorized: StoredTransaction[];
}

/**
 * Range les transactions par groupe puis par catégorie. Une transaction sans catégorie, ou dont la
 * catégorie n'existe plus, va dans `uncategorized`. Les groupes et catégories vides sont omis ;
 * les catégories sont triées par montant absolu décroissant.
 */
export function groupStoredTransactions(
  transactions: StoredTransaction[],
  categories: Category[],
  categoryGroups: CategoryGroup[],
): MonthBreakdown {
  const categoriesById = new Map(categories.map((category) => [category.id, category]));
  const transactionsByCategory = new Map<string, StoredTransaction[]>();
  const uncategorized: StoredTransaction[] = [];

  transactions.forEach((transaction) => {
    if (!transaction.category_id || !categoriesById.has(transaction.category_id)) {
      uncategorized.push(transaction);
      return;
    }
    const list = transactionsByCategory.get(transaction.category_id) ?? [];
    list.push(transaction);
    transactionsByCategory.set(transaction.category_id, list);
  });

  const groups = categoryGroups
    .map((group): GroupBreakdown => {
      const groupCategories = categories
        .filter((category) => category.cat_group_key === group.id)
        .flatMap((category): CategoryBreakdown[] => {
          const categoryTransactions = transactionsByCategory.get(category.id);
          if (!categoryTransactions) return [];
          return [{
            categoryId: category.id,
            label: category.label,
            total: categoryTransactions.reduce((sum, transaction) => sum + Number(transaction.amount), 0),
            transactions: categoryTransactions,
          }];
        })
        .sort((first, second) =>
          Math.abs(second.total) - Math.abs(first.total) || first.label.localeCompare(second.label, 'fr'),
        );

      return {
        id: group.id,
        key: group.label || String(group.id),
        title: group.libelle,
        total: groupCategories.reduce((sum, category) => sum + category.total, 0),
        categories: groupCategories,
      };
    })
    .filter((group) => group.categories.length > 0);

  return { groups, uncategorized };
}
