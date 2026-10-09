import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { computeGamification, countPointedOn, type ActivityRow } from '@/utils/gamification';

const originalTimezone = process.env.TZ;
beforeAll(() => {
  process.env.TZ = 'Europe/Paris';
});
afterAll(() => {
  if (originalTimezone === undefined) delete process.env.TZ;
  else process.env.TZ = originalTimezone;
});

const row = (reconciledAt: string | null): ActivityRow => ({ booked_on: '2026-10-02', reconciled_at: reconciledAt });

describe('countPointedOn', () => {
  it('compte les opérations pointées le jour demandé, pas celles de la veille ni les non pointées', () => {
    const rows = [row('2026-10-08T08:00:00+02:00'), row('2026-10-08T18:00:00+02:00'), row('2026-10-07T18:00:00+02:00'), row(null)];
    expect(countPointedOn(rows, new Date('2026-10-08T12:00:00+02:00'))).toBe(2);
  });

  it('compte un pointage à 00 h 30 heure de Paris pour le nouveau jour local, pas pour la veille UTC', () => {
    const rows = [row('2026-10-08T22:30:00Z')];
    expect(countPointedOn(rows, new Date('2026-10-09T09:00:00+02:00'))).toBe(1);
    expect(countPointedOn(rows, new Date('2026-10-08T12:00:00+02:00'))).toBe(0);
  });

  it('vaut 0 sans aucune opération', () => {
    expect(countPointedOn([], new Date('2026-10-08T12:00:00+02:00'))).toBe(0);
  });
});

describe('computeGamification.pointedToday', () => {
  it('reprend le nombre de pointages du jour', () => {
    const now = new Date('2026-10-08T12:00:00+02:00');
    const result = computeGamification([row('2026-10-08T09:00:00+02:00'), row('2026-10-07T09:00:00+02:00')], now);
    expect(result.pointedToday).toBe(1);
  });
});
