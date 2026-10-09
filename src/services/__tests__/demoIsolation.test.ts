import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const rpc = vi.fn();
vi.mock('@/lib/supabaseClient', () => ({ supabase: { rpc: (...a: unknown[]) => rpc(...a) } }));

import { endDemo, startDemo } from '@/services/demoStore';
import { archiveMonth } from '@/services/archiveService';

beforeEach(() => {
  rpc.mockReset();
  const store = new Map<string, string>();
  vi.stubGlobal('window', {
    localStorage: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    },
    dispatchEvent: () => true,
  });
  vi.stubGlobal('Event', class { constructor(public type: string) {} });
});
afterEach(() => {
  endDemo();
  vi.unstubAllGlobals();
});

describe('isolation du mode exemple', () => {
  it('n’archive jamais le vrai mois depuis l’exemple', async () => {
    startDemo([
      { id: 'demo-0', booked_on: '2026-10-02', label: 'X', amount: -5, category_id: 'c', category_key: null, type: 'AUTRE', reconciled_at: 'x' },
    ]);
    await expect(archiveMonth(2026, 9)).rejects.toThrow(/exemple/i);
    expect(rpc).not.toHaveBeenCalled();
  });
});
