import { describe, expect, it } from 'vitest';
import { buildDemoTransactions } from '@/utils/demoStatement';

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
