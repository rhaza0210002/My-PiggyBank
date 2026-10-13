import { describe, expect, it } from 'vitest';
import { toIsoDate } from '@/utils/csvParsing';

describe('toIsoDate', () => {
  it('convertit les dates françaises', () => {
    expect(toIsoDate('07/09/2026')).toBe('2026-09-07');
    expect(toIsoDate('7-9-26')).toBe('2026-09-07');
  });

  it('accepte les dates ISO', () => {
    expect(toIsoDate('2026-10-02')).toBe('2026-10-02');
  });

  it('refuse les dates qui n’existent pas ou illisibles', () => {
    expect(toIsoDate('31/02/2026')).toBeNull();
    expect(toIsoDate('abc')).toBeNull();
    expect(toIsoDate('')).toBeNull();
  });
});
