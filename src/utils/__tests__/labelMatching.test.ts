import { describe, expect, it } from 'vitest';
import { checkRuleKeyword, normalizeMatchText, suggestRuleKeyword } from '@/utils/labelMatching';

describe('suggestRuleKeyword', () => {
  it('retient le commerçant d’un paiement par carte', () => {
    expect(suggestRuleKeyword('CARTE X1234 15/09 PAIEMENT CB ALDI CHAUNY')).toBe('ALDI');
  });

  it('ignore les mots génériques d’un prélèvement', () => {
    expect(suggestRuleKeyword('PRLV SEPA ORANGE FACTURE 0922')).toBe('ORANGE');
  });

  it('ignore les numéros, dates et mots trop courts', () => {
    expect(suggestRuleKeyword('15/09 12345 LE A.B Boulangerie Dupont')).toBe('Boulangerie');
  });

  it('renvoie une chaîne vide si rien ne convient', () => {
    expect(suggestRuleKeyword('CB 12 34 LE')).toBe('');
  });
});

describe('checkRuleKeyword', () => {
  const label = 'CARTE X1234 PAIEMENT CB ALDI CHAUNY';

  it('accepte un mot présent dans le libellé, sans tenir compte de la casse ni des accents', () => {
    expect(checkRuleKeyword('aldi', label)).toBeNull();
    expect(checkRuleKeyword('Cháuny', label)).toBeNull();
  });

  it('refuse un mot trop court', () => {
    expect(checkRuleKeyword('al', label)).toBe('too-short');
  });

  it('refuse un mot absent du libellé', () => {
    expect(checkRuleKeyword('lidl', label)).toBe('not-in-label');
  });
});

describe('normalizeMatchText', () => {
  it('retire accents, ponctuation et espaces', () => {
    expect(normalizeMatchText('E.Leclerc Étampes')).toBe('eleclercetampes');
  });
});
