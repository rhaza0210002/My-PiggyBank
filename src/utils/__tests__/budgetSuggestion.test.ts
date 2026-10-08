import { describe, expect, it } from 'vitest';
import { suggestBudgetAmounts } from '@/utils/budgetSuggestion';
import type { DataGroup } from '@/types/budget';

const groups: DataGroup[] = [
  {
    id: 1,
    title: 'Réserve de frais',
    key: 'reserve',
    rows: [
      { categoryId: 'food', category: 'Alimentation', values: Array(12).fill('-') },
      { categoryId: 'tabac', category: 'Tabac', values: Array(12).fill(40) },
    ],
  },
  { id: 2, title: 'Revenus', key: 'revenus', rows: [{ categoryId: 'caf', category: 'C.A.F', values: Array(12).fill('-') }] },
];

describe('suggestion de budget', () => {
  it('somme le réel par catégorie, arrondi à l’euro et toujours positif', () => {
    const result = suggestBudgetAmounts(
      [
        { amount: -34.52, category_id: 'food' },
        { amount: -10.2, category_id: 'food' },
        { amount: 571.97, category_id: 'caf' },
      ],
      groups,
      9,
    );
    expect(result).toEqual([
      { groupKey: 'reserve', category: 'Alimentation', amount: 45 },
      { groupKey: 'revenus', category: 'C.A.F', amount: 572 },
    ]);
  });

  it('ne touche jamais une ligne déjà remplie pour ce mois', () => {
    const result = suggestBudgetAmounts([{ amount: -99, category_id: 'tabac' }], groups, 9);
    expect(result).toEqual([]);
  });

  it('ignore les opérations sans catégorie et les catégories sans dépense', () => {
    expect(suggestBudgetAmounts([{ amount: -20, category_id: null }], groups, 9)).toEqual([]);
  });
});
