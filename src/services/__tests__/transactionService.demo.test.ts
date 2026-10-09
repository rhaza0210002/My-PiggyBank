import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { StoredTransaction } from '@/services/transactionService';

const from = vi.fn(() => {
  throw new Error('Supabase appelé en mode exemple');
});
vi.mock('@/lib/supabaseClient', () => ({ supabase: { from: (...args: unknown[]) => (from as (...a: unknown[]) => unknown)(...args) } }));
vi.mock('@/lib/currentUser', () => ({ requireUserId: async () => 'user' }));
vi.mock('@/services/archiveService', () => ({
  getArchivedMonths: async () => {
    throw new Error('archives appelées en mode exemple');
  },
  getArchivedMonthActuals: async () => {
    throw new Error('archives appelées en mode exemple');
  },
}));

import { endDemo, startDemo } from '@/services/demoStore';
import {
  countTransactionsToReconcile,
  countUncategorizedTransactions,
  getMonthTotals,
  getPointedLabelHistory,
  getReconciliationActivity,
  getRecentTransactions,
  getTransactionsForMonth,
  getTransactionsToReconcile,
  getUncategorizedTransactions,
  markTransactionsReconciled,
  unreconcileTransactions,
  updateTransactionCategory,
} from '@/services/transactionService';

const row = (id: string, booked_on: string, amount: number, category_id: string | null = null): StoredTransaction => ({
  id,
  booked_on,
  label: `LIBELLE ${id}`,
  amount,
  category_id,
  category_key: null,
  type: 'AUTRE',
  reconciled_at: null,
});

let store: Map<string, string>;

beforeEach(() => {
  from.mockClear();
  store = new Map();
  vi.stubGlobal('window', {
    localStorage: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => void store.set(key, value),
      removeItem: (key: string) => void store.delete(key),
    },
    dispatchEvent: () => true,
  });
  vi.stubGlobal('Event', class { constructor(public type: string) {} });
  startDemo([
    row('demo-0', '2026-10-01', 1850, 'cat-salaire'),
    row('demo-1', '2026-10-05', -620, 'cat-loyer'),
    row('demo-2', '2026-10-09', -6.4),
    row('demo-3', '2026-09-30', -100),
  ]);
});

afterEach(() => {
  endDemo();
  vi.unstubAllGlobals();
});

describe('transactionService en mode exemple', () => {
  it('lit les opérations du stock, de la plus récente à la plus ancienne, avec la limite', async () => {
    expect((await getRecentTransactions(3)).map((r) => r.id)).toEqual(['demo-2', 'demo-1', 'demo-0']);
    expect((await getTransactionsToReconcile(10)).map((r) => r.id)).toEqual(['demo-2', 'demo-1', 'demo-0', 'demo-3']);
    expect(await countTransactionsToReconcile()).toBe(4);
  });

  it('pointe puis annule : l’opération quitte puis revient dans celles à rapprocher et dans l’historique', async () => {
    await markTransactionsReconciled(['demo-1']);
    expect(await countTransactionsToReconcile()).toBe(3);
    expect(await getPointedLabelHistory()).toEqual([{ label: 'LIBELLE demo-1', category_id: 'cat-loyer' }]);

    await unreconcileTransactions(['demo-1']);
    expect(await countTransactionsToReconcile()).toBe(4);
    expect(await getPointedLabelHistory()).toEqual([]);
  });

  it('change la catégorie et compte les opérations sans catégorie', async () => {
    expect(await countUncategorizedTransactions()).toBe(2);
    await updateTransactionCategory('demo-2', 'cat-pain');
    expect(await countUncategorizedTransactions()).toBe(1);
    expect((await getUncategorizedTransactions(10)).map((r) => r.id)).toEqual(['demo-3']);
    const updated = (await getRecentTransactions(10)).find((r) => r.id === 'demo-2');
    expect(updated).toMatchObject({ category_id: 'cat-pain', category_key: null });
  });

  it('limite les totaux et les opérations d’un mois à ce mois (le 1er compte, le 30 septembre non)', async () => {
    expect((await getTransactionsForMonth(2026, 9)).map((r) => r.id)).toEqual(['demo-2', 'demo-1', 'demo-0']);
    expect(await getMonthTotals(2026, 9)).toEqual({ income: 1850, expenses: -626.4, net: 1223.6, count: 3 });
    expect((await getMonthTotals(2026, 8)).count).toBe(1);
  });

  it('ne donne aucune activité aux récompenses', async () => {
    expect(await getReconciliationActivity()).toEqual([]);
  });

  it('n’appelle jamais Supabase', () => {
    expect(from).not.toHaveBeenCalled();
  });
});

describe('transactionService hors mode exemple', () => {
  it('lit toujours dans Supabase', async () => {
    endDemo();
    const chain = { select: () => chain, order: () => chain, limit: async () => ({ data: [], error: null }) };
    from.mockImplementationOnce(() => chain as never);
    expect(await getRecentTransactions(5)).toEqual([]);
    expect(from).toHaveBeenCalledWith('transactions');
  });
});
