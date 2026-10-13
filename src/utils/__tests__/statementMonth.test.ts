import { describe, expect, it } from 'vitest';
import { statementMonth } from '@/utils/statementMonth';

describe('statementMonth', () => {
  it('prend le mois du relevé, pas le mois en cours', () => {
    expect(statementMonth(['2026-09-01', '2026-09-15', '2026-09-20'])).toEqual({ year: 2026, monthIndex: 8 });
    expect(statementMonth(['01/09/2026', '15/09/2026'])).toEqual({ year: 2026, monthIndex: 8 });
  });

  it('retient le mois le plus présent, le plus récent à égalité', () => {
    expect(statementMonth(['2026-08-30', '2026-09-01', '2026-09-02'])).toEqual({ year: 2026, monthIndex: 8 });
    expect(statementMonth(['2026-08-30', '2026-09-01'])).toEqual({ year: 2026, monthIndex: 8 });
  });

  it('ne devine rien sans date lisible', () => {
    expect(statementMonth([])).toBeNull();
    expect(statementMonth(['pas une date'])).toBeNull();
  });
});
