import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
vi.mock('@/lib/supabaseClient', () => ({ supabase: {} }));

import { MonthRecapView } from '@/components/features/gamification/MonthRecapCard';
import type { MonthRecap } from '@/utils/monthRecap';

const recap: MonthRecap = {
  operations: 4,
  budgetedCount: 8,
  withinBudgetCount: 8,
  topCategory: { label: 'Banque', spent: 48 },
  overBudget: [],
} as MonthRecap;

describe('MonthRecapView', () => {
  it('replie la liste par défaut, avec un bouton à flèche qui l’annonce', () => {
    const html = renderToStaticMarkup(<MonthRecapView recap={recap} monthIndex={9} isAmountShown />);
    expect(html).toContain('Ton bilan d’octobre');
    expect(html).toMatch(/<button[^>]*aria-expanded="false"[^>]*aria-controls="/);
    expect(html).toContain('▾');
    expect(html).not.toContain('pointée');
    expect(html).not.toContain('Banque');
  });
});
