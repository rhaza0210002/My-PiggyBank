import { describe, expect, it } from 'vitest';
import { archivedActivityRows, archivedToTransactions, getArchiveBlocker } from '@/utils/archive';
import { computeGamification } from '@/utils/gamification';

describe('archivage d’un mois', () => {
  it('refuse un mois vide, non pointé ou non catégorisé', () => {
    expect(getArchiveBlocker([])).toMatch(/Aucune/);
    expect(getArchiveBlocker([{ category_id: 'a', reconciled_at: null }])).toMatch(/Pointe/);
    expect(getArchiveBlocker([{ category_id: null, reconciled_at: '2026-10-01T10:00:00Z' }])).toMatch(/Catégorise/);
  });

  it('accepte un mois entièrement pointé et catégorisé', () => {
    expect(getArchiveBlocker([{ category_id: 'a', reconciled_at: '2026-10-01T10:00:00Z' }])).toBeNull();
  });

  it('présente un total par catégorie comme une opération pointée, sans libellé bancaire', () => {
    const [row] = archivedToTransactions([{ category_id: 'food', amount: '-120.50', operations_count: 3 }], 2026, 8, '2026-09-30T10:00:00Z');
    expect(row).toMatchObject({ booked_on: '2026-09-01', amount: -120.5, category_id: 'food', reconciled_at: '2026-09-30T10:00:00Z' });
    expect(row.label).toBe('Total archivé (3 opérations)');
  });

  it('garde les points : un mois archivé vaut ses opérations pointées + le mois bouclé', () => {
    const rows = archivedActivityRows([{ year: 2026, month_index: 8, operations_count: 4, completed_at: '2026-10-02T10:00:00Z' }]);
    expect(rows).toHaveLength(4);
    const result = computeGamification(rows, new Date('2026-10-08T12:00:00Z'));
    expect(result.reconciledOperations).toBe(4);
    expect(result.completedMonths).toBe(1);
    expect(result.xp).toBe(4 * 10 + 100 + 50);
  });
});
