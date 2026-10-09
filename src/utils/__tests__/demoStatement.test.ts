import { describe, expect, it } from 'vitest';
import { buildDemoTransactions, shouldConfirmReplaceDemo, toStoredDemo } from '@/utils/demoStatement';

const NOW = new Date(2026, 9, 8);

describe('relevé d’exemple', () => {
  it('fournit des opérations du mois en cours, revenus et dépenses, sans catégorie quand aucune règle ne correspond', () => {
    const rows = buildDemoTransactions([], NOW);
    expect(rows.length).toBeGreaterThan(5);
    expect(rows.every((row) => row.date.startsWith('2026-10'))).toBe(true);
    expect(rows.some((row) => row.amount > 0)).toBe(true);
    expect(rows.some((row) => row.amount < 0)).toBe(true);
    expect(rows.every((row) => row.categoryId === null)).toBe(true);
  });

  it('range une ligne dans la vraie catégorie de l’utilisateur quand une règle correspond', () => {
    const rows = buildDemoTransactions([{ id: 'r1', label: 'Loyer', key: 'Loyer', id_cat: 'cat-loyer' }], NOW);
    const rent = rows.find((row) => row.rawDetail.startsWith('LOYER'));
    expect(rent?.categoryId).toBe('cat-loyer');
  });

  it('a des identifiants uniques', () => {
    const ids = buildDemoTransactions([], NOW).map((row) => row.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('toStoredDemo', () => {
  it('convertit l’exemple en opérations stockées, non pointées', () => {
    const stored = toStoredDemo(buildDemoTransactions([], new Date(2026, 9, 9)));
    expect(stored).toHaveLength(8);
    expect(stored[0]).toEqual({
      id: 'demo-0',
      booked_on: '2026-10-01',
      label: 'VIREMENT SALAIRE EXEMPLE',
      amount: 1850,
      category_id: null,
      category_key: null,
      type: 'VIREMENT_ENTRANT',
      reconciled_at: null,
    });
  });

  it('écarte les lignes dont la date n’existe pas', () => {
    const rows = buildDemoTransactions([], new Date(2026, 9, 9));
    rows[1] = { ...rows[1], date: '31/02/2026' };
    expect(toStoredDemo(rows).map((row) => row.id)).not.toContain('demo-1');
  });
});

describe('shouldConfirmReplaceDemo', () => {
  it('demande confirmation seulement pour un vrai fichier pendant un exemple actif', () => {
    expect(shouldConfirmReplaceDemo(true, false)).toBe(true);
    expect(shouldConfirmReplaceDemo(true, true)).toBe(false);
    expect(shouldConfirmReplaceDemo(false, false)).toBe(false);
  });
});
