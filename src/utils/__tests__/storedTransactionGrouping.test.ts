import { describe, expect, it } from 'vitest';
import type { Category, CategoryGroup } from '@/services/transactionCategoryService';
import type { StoredTransaction } from '@/services/transactionService';
import { groupStoredTransactions } from '@/utils/storedTransactionGrouping';

const groups: CategoryGroup[] = [
  { id: 1, label: 'revenus', libelle: 'Revenus' },
  { id: 2, label: 'services', libelle: 'Décaissement services' },
];
const categories: Category[] = [
  { id: 'caf', label: 'C.A.F', cat_group_key: 1 },
  { id: 'eau', label: 'Eau', cat_group_key: 2 },
  { id: 'loyer', label: 'Loyer', cat_group_key: 2 },
];

function stored(id: string, amount: number, categoryId: string | null): StoredTransaction {
  return {
    id,
    booked_on: '2026-09-07',
    label: id,
    amount,
    category_id: categoryId,
    category_key: null,
    type: 'AUTRE',
    reconciled_at: null,
  };
}

describe('groupStoredTransactions', () => {
  it('range par groupe et catégorie, triées par montant absolu décroissant', () => {
    const { groups: result } = groupStoredTransactions(
      [stored('a', -24.26, 'eau'), stored('b', -129, 'loyer'), stored('c', -8.61, 'eau')],
      categories,
      groups,
    );

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Décaissement services');
    expect(result[0].categories.map((category) => category.label)).toEqual(['Loyer', 'Eau']);
    expect(result[0].categories[1].total).toBeCloseTo(-32.87);
    expect(result[0].total).toBeCloseTo(-161.87);
  });

  it('omet les groupes sans transaction', () => {
    const { groups: result } = groupStoredTransactions([stored('a', 571.97, 'caf')], categories, groups);

    expect(result.map((group) => group.title)).toEqual(['Revenus']);
  });

  it('classe sans catégorie ou catégorie inconnue dans uncategorized', () => {
    const { groups: result, uncategorized } = groupStoredTransactions(
      [stored('a', -7, null), stored('b', 5, 'supprimee')],
      categories,
      groups,
    );

    expect(result).toHaveLength(0);
    expect(uncategorized.map((transaction) => transaction.id)).toEqual(['a', 'b']);
  });
});
