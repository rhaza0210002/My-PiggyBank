import { describe, expect, it } from 'vitest';
import { formatCurrency } from '@/utils/budgetCalculations';

describe('formatCurrency', () => {
  it('écrit les montants à la française (virgule, espace avant €)', () => {
    expect(formatCurrency(40).replace(/\s/g, ' ')).toBe('40,00 €');
    expect(formatCurrency('1234.5').replace(/\s/g, ' ')).toBe('1 234,50 €');
  });

  it('garde un tiret pour l’absence de montant', () => {
    expect(formatCurrency('-')).toBe('—');
  });
});
