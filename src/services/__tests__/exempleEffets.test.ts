import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/supabaseClient', () => ({ supabase: {} }));
vi.mock('@/lib/currentUser', () => ({ requireUserId: async () => 'user' }));
const { never } = vi.hoisted(() => ({
  never: (name: string) => async () => {
    throw new Error(`${name} appelé en mode exemple`);
  },
}));
vi.mock('@/services/budgetService', () => ({ getBudgetEntries: never('getBudgetEntries') }));
vi.mock('@/services/transactionCategoryService', () => ({ getCategories: never('getCategories') }));
vi.mock('@/services/archiveService', () => ({
  getArchivedMonths: never('getArchivedMonths'),
  getArchivedMonthActuals: never('getArchivedMonthActuals'),
}));

import { endDemo, isDemoActive, startDemo } from '@/services/demoStore';
import { getNotifications } from '@/services/notificationService';
import { clearLocalPersonalData } from '@/services/personalDataService';

beforeEach(() => {
  const store = new Map<string, string>();
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
    { id: 'demo-0', booked_on: '2026-10-02', label: 'X', amount: -5, category_id: null, category_key: null, type: 'AUTRE', reconciled_at: null },
  ]);
});

afterEach(() => {
  endDemo();
  vi.unstubAllGlobals();
});

describe('effets annexes du mode exemple', () => {
  it('ne produit aucune notification (et n’interroge aucun service)', async () => {
    const settings = { notify_reconcile: true, notify_budget_overrun: true } as never;
    expect(await getNotifications(settings, new Date(2026, 9, 9))).toEqual([]);
  });

  it('s’efface avec les données locales de la personne (déconnexion)', () => {
    expect(isDemoActive()).toBe(true);
    clearLocalPersonalData();
    expect(isDemoActive()).toBe(false);
  });
});
