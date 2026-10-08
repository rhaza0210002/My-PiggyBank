import { describe, expect, it } from 'vitest';
import { buildMonthRecap } from '@/utils/monthRecap';

const categories = [
  { id: 'food', label: 'Alimentation' },
  { id: 'fun', label: 'Loisirs' },
  { id: 'rent', label: 'Loyer' },
];

describe('bilan de fin de mois', () => {
  it('compte les catégories restées dans le budget et repère les dépassements', () => {
    const recap = buildMonthRecap(
      [
        { category_id: 'food', amount: -80 },
        { category_id: 'fun', amount: -70 },
        { category_id: 'rent', amount: -500 },
        { category_id: null, amount: -10 },
        { category_id: 'rent', amount: 1500 },
      ],
      [
        { category_id: 'food', month_index: 9, amount: 100 },
        { category_id: 'fun', month_index: 9, amount: 50 },
        { category_id: 'rent', month_index: 9, amount: 500 },
        { category_id: 'food', month_index: 8, amount: 1 },
      ],
      categories,
      9,
    );
    expect(recap.operations).toBe(5);
    expect(recap.budgetedCount).toBe(3);
    expect(recap.withinBudgetCount).toBe(2);
    expect(recap.overBudget).toEqual([{ label: 'Loisirs', spent: 70, budget: 50 }]);
    expect(recap.topCategory).toEqual({ label: 'Loyer', spent: 500 });
  });

  it('ignore les catégories sans budget et ne plante pas sans donnée', () => {
    const recap = buildMonthRecap([], [{ category_id: 'food', month_index: 0, amount: 0 }], categories, 0);
    expect(recap).toEqual({ operations: 0, budgetedCount: 0, withinBudgetCount: 0, overBudget: [], topCategory: null });
  });
});
