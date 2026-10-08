import { describe, expect, it, vi } from 'vitest';

// Le client Supabase exige des variables d'environnement : inutile pour tester un calcul pur.
vi.mock('@/lib/supabaseClient', () => ({ supabase: {} }));

import { summarizeAmounts } from '@/services/transactionService';

describe('summarizeAmounts', () => {
  it('sépare revenus et dépenses et calcule le solde', () => {
    expect(summarizeAmounts([571.97, -150.43, -129, 5])).toEqual({
      income: 576.97,
      expenses: -279.43,
      net: 297.54,
      count: 4,
    });
  });

  it('retourne des zéros sans transaction', () => {
    expect(summarizeAmounts([])).toEqual({ income: 0, expenses: 0, net: 0, count: 0 });
  });
});
