import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { StoredTransaction } from '@/services/transactionService';

vi.mock('@/lib/supabaseClient', () => ({ supabase: {} }));

import {
  DEMO_EVENT,
  DEMO_STORAGE_KEY,
  endDemo,
  isDemoActive,
  readDemoTransactions,
  startDemo,
  updateDemoTransactions,
} from '@/services/demoStore';

const row = (id: string, amount = -10): StoredTransaction => ({
  id,
  booked_on: '2026-10-02',
  label: `LIBELLE ${id}`,
  amount,
  category_id: null,
  category_key: null,
  type: 'AUTRE',
  reconciled_at: null,
});

let store: Map<string, string>;
let events: string[];
let refuseWrites = false;

beforeEach(() => {
  store = new Map();
  events = [];
  refuseWrites = false;
  vi.stubGlobal('window', {
    localStorage: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        if (refuseWrites) throw new Error('quota');
        store.set(key, value);
      },
      removeItem: (key: string) => void store.delete(key),
    },
    dispatchEvent: (event: Event) => {
      events.push(event.type);
      return true;
    },
  });
  vi.stubGlobal('Event', class { constructor(public type: string) {} });
});

afterEach(() => vi.unstubAllGlobals());

describe('demoStore', () => {
  it('démarre, relit, met à jour puis quitte l’exemple', () => {
    expect(isDemoActive()).toBe(false);
    expect(startDemo([row('demo-0'), row('demo-1')])).toBe(true);
    expect(isDemoActive()).toBe(true);
    expect(readDemoTransactions().map((r) => r.id)).toEqual(['demo-0', 'demo-1']);

    updateDemoTransactions((rows) => rows.map((r) => ({ ...r, reconciled_at: '2026-10-09T10:00:00Z' })));
    expect(readDemoTransactions().every((r) => r.reconciled_at !== null)).toBe(true);

    endDemo();
    expect(isDemoActive()).toBe(false);
    expect(readDemoTransactions()).toEqual([]);
  });

  it.each([
    ['du texte qui n’est pas du JSON', 'pas du json'],
    ['une autre version', '{"version":2,"transactions":[]}'],
    ['des opérations qui ne sont pas une liste', '{"version":1,"transactions":"x"}'],
    ['des lignes sans identifiant', '{"version":1,"transactions":[{"amount":1}]}'],
  ])('traite %s comme « pas d’exemple »', (_name, raw) => {
    store.set(DEMO_STORAGE_KEY, raw);
    expect(isDemoActive()).toBe(false);
    expect(readDemoTransactions()).toEqual([]);
  });

  it('renvoie false quand le stockage refuse l’écriture', () => {
    refuseWrites = true;
    expect(startDemo([row('demo-0')])).toBe(false);
    expect(isDemoActive()).toBe(false);
  });

  it('prévient les écrans (événement) à chaque écriture et à la sortie', () => {
    startDemo([row('demo-0')]);
    updateDemoTransactions((rows) => rows);
    endDemo();
    expect(events).toEqual([DEMO_EVENT, DEMO_EVENT, DEMO_EVENT]);
  });
});
