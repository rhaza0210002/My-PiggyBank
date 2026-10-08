import { describe, expect, it } from 'vitest';
import { isCsvAmountCell, parseCsvAmount, toIsoDate } from '@/utils/csvParsing';

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

describe('parseCsvAmount', () => {
  it('lit les montants au format français', () => {
    expect(parseCsvAmount('-11,87')).toBe(-11.87);
    expect(parseCsvAmount('1.234,50 €')).toBe(1234.5);
    expect(parseCsvAmount('(7,00)')).toBe(-7);
  });

  it('retourne null pour une valeur vide ou invalide', () => {
    expect(parseCsvAmount('')).toBeNull();
    expect(parseCsvAmount('-')).toBeNull();
    expect(parseCsvAmount('abc')).toBeNull();
  });
});

describe('isCsvAmountCell', () => {
  it('distingue un montant d’un libellé', () => {
    expect(isCsvAmountCell('-26,99')).toBe(true);
    expect(isCsvAmountCell('CARTE X3076')).toBe(false);
  });
});
