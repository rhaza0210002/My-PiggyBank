import { describe, expect, it } from 'vitest';
import { getDifference, isIncomeGroup } from '@/utils/budgetComparison';

describe('isIncomeGroup', () => {
  it('reconnaît le groupe Revenus', () => {
    expect(isIncomeGroup({ label: 'revenus', libelle: 'Revenus' })).toBe(true);
  });

  it('ne confond pas les groupes de dépenses', () => {
    expect(isIncomeGroup({ label: 'services', libelle: 'Décaissement services' })).toBe(false);
    expect(isIncomeGroup({ label: null, libelle: undefined })).toBe(false);
  });
});

describe('getDifference', () => {
  it('dépense : positif quand on dépense moins que prévu', () => {
    expect(getDifference(false, 100, -80)).toBe(20);
  });

  it('dépense : négatif en cas de dépassement', () => {
    expect(getDifference(false, 11.87, -19.67)).toBeCloseTo(-7.8);
  });

  it('revenu : positif quand on reçoit plus que prévu', () => {
    expect(getDifference(true, 500, 571.97)).toBeCloseTo(71.97);
  });

  it('revenu : négatif quand il manque de l’argent', () => {
    expect(getDifference(true, 571.97, 0)).toBeCloseTo(-571.97);
  });
});
