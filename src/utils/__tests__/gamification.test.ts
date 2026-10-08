import { describe, expect, it } from 'vitest';
import { computeGamification, getLevelInfo, type ActivityRow } from '@/utils/gamification';
import { pickTip, TIPS } from '@/utils/tips';

const NOW = new Date(2026, 9, 8); // octobre 2026

function op(date: string, done: boolean): ActivityRow {
  return { booked_on: date, reconciled_at: done ? '2026-10-08T10:00:00Z' : null };
}

describe('computeGamification', () => {
  it('n’a aucun point sans opération pointée', () => {
    const result = computeGamification([op('2026-10-02', false)], NOW);

    expect(result.xp).toBe(0);
    expect(result.levelInfo.level).toBe(1);
    expect(result.badges.every((badge) => !badge.earned)).toBe(true);
    expect(result.currentMonth).toMatchObject({ total: 1, done: 0, status: 'in-progress' });
  });

  it('donne 10 XP par opération et 100 XP pour un mois complet', () => {
    const result = computeGamification([op('2026-10-02', true), op('2026-10-03', true)], NOW);

    expect(result.reconciledOperations).toBe(2);
    expect(result.completedMonths).toBe(1);
    expect(result.xp).toBe(2 * 10 + 100);
    expect(result.currentMonth.status).toBe('complete');
  });

  it('un mois passé incomplet est « à rattraper » sans retirer de points', () => {
    const rows = [op('2026-09-02', true), op('2026-09-03', false), op('2026-10-01', true)];
    const result = computeGamification(rows, NOW);

    expect(result.months[8].status).toBe('catch-up');
    expect(result.xp).toBe(2 * 10 + 100);
  });

  it('rattraper un mois passé rapporte un bonus et le badge de rattrapage', () => {
    const before = computeGamification([op('2026-09-02', true), op('2026-09-03', false)], NOW);
    const after = computeGamification([op('2026-09-02', true), op('2026-09-03', true)], NOW);

    expect(after.xp).toBeGreaterThan(before.xp);
    expect(after.xp).toBe(2 * 10 + 100 + 50);
    expect(after.caughtUpMonths).toBe(1);
    expect(after.badges.find((badge) => badge.id === 'catch-up')?.earned).toBe(true);
  });

  it('les points ne baissent jamais quand on passe à un mois suivant sans pointer', () => {
    const rows = [op('2026-09-02', true), op('2026-09-03', true)];
    const inSeptember = computeGamification(rows, new Date(2026, 8, 20));
    const inNovember = computeGamification(rows, new Date(2026, 10, 20));

    expect(inNovember.xp).toBeGreaterThanOrEqual(inSeptember.xp);
    expect(inNovember.completedMonths).toBe(inSeptember.completedMonths);
  });

  it('marque les mois sans opération « empty » et les mois à venir « future »', () => {
    const result = computeGamification([op('2026-10-02', true)], NOW);

    expect(result.months[0].status).toBe('empty');
    expect(result.months[10].status).toBe('future');
  });
});

describe('getLevelInfo', () => {
  it('monte de niveau avec les XP et expose la progression du niveau', () => {
    expect(getLevelInfo(0)).toMatchObject({ level: 1, xpIntoLevel: 0, xpForNext: 50 });
    expect(getLevelInfo(50)).toMatchObject({ level: 2, xpIntoLevel: 0, xpForNext: 150 });
    expect(getLevelInfo(120)).toMatchObject({ level: 2, xpIntoLevel: 70 });
  });
});

describe('pickTip', () => {
  it('est stable dans la journée et change avec le décalage', () => {
    const day = new Date(2026, 9, 8, 8);
    const evening = new Date(2026, 9, 8, 22);

    expect(pickTip(day).id).toBe(pickTip(evening).id);
    expect(pickTip(day, 1).id).not.toBe(pickTip(day).id);
    expect(TIPS.length).toBeGreaterThan(10);
  });
});
