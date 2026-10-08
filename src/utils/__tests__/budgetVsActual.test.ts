import { describe, expect, it } from 'vitest';
import type { BudgetEntry } from '@/services/budgetService';
import type { Category, CategoryGroup } from '@/services/transactionCategoryService';
import type { StoredTransaction } from '@/services/transactionService';
import { buildBudgetVsActualSlices } from '@/utils/budgetVsActual';

const groups: CategoryGroup[] = [
  { id: 3, label: 'revenus', libelle: 'Revenus' },
  { id: 1, label: 'decaissement', libelle: 'Décaissement services' },
  { id: 2, label: 'reserve', libelle: 'Réserve de frais' },
];
const categories: Category[] = [
  { id: 'caf', label: 'C.A.F', cat_group_key: 3 },
  { id: 'loyer', label: 'Loyer', cat_group_key: 1 },
  { id: 'eau', label: 'Eau', cat_group_key: 1 },
  { id: 'food', label: 'Alimentation', cat_group_key: 2 },
  { id: 'vide', label: 'Épargne', cat_group_key: 2 },
];

function budget(categoryId: string, monthIndex: number, amount: number): BudgetEntry {
  return { category_id: categoryId, month_index: monthIndex, amount };
}

function stored(categoryId: string | null, amount: number): StoredTransaction {
  return {
    id: `${categoryId}-${amount}`,
    booked_on: '2026-09-07',
    label: 'x',
    amount,
    category_id: categoryId,
    category_key: null,
    type: 'AUTRE',
    reconciled_at: null,
  };
}

describe('buildBudgetVsActualSlices', () => {
  it('ignore les revenus et les catégories sans budget ni dépense', () => {
    const slices = buildBudgetVsActualSlices(
      8,
      [budget('caf', 8, 571.97), budget('loyer', 8, 129)],
      [stored('caf', 571.97)],
      categories,
      groups,
    );

    expect(slices.map((slice) => slice.label)).toEqual(['Loyer']);
  });

  it('ne retient que le mois demandé et suit l’ordre groupes puis libellés', () => {
    const slices = buildBudgetVsActualSlices(
      8,
      [budget('food', 8, 100), budget('eau', 8, 72), budget('loyer', 9, 129)],
      [],
      categories,
      groups,
    );

    expect(slices.map((slice) => slice.label)).toEqual(['Eau', 'Alimentation']);
  });

  it('compte la dépense réelle en positif, remboursements déduits, et garde une dépense non budgétée', () => {
    const slices = buildBudgetVsActualSlices(
      8,
      [budget('food', 8, 100)],
      [stored('food', -60), stored('food', -45.5), stored('food', 10), stored('eau', -24.26), stored(null, -5)],
      categories,
      groups,
    );

    expect(slices).toEqual([
      expect.objectContaining({ label: 'Eau', budget: 0, actual: 24.26 }),
      expect.objectContaining({ label: 'Alimentation', budget: 100, actual: 95.5 }),
    ]);
  });

  it('ramène à zéro un solde réel positif (remboursement supérieur aux dépenses)', () => {
    const [slice] = buildBudgetVsActualSlices(8, [budget('eau', 8, 72)], [stored('eau', 20)], categories, groups);

    expect(slice.actual).toBe(0);
  });
});
