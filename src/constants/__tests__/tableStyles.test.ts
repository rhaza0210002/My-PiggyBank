import { describe, expect, it } from 'vitest';
import { TABLE_STYLES } from '@/constants/tableStyles';

describe('style des tableaux', () => {
  it('n’utilise que les couleurs du thème', () => {
    for (const value of Object.values(TABLE_STYLES)) expect(value).not.toMatch(/#[0-9a-fA-F]{3,8}/);
  });

  it('aligne les montants à droite avec des chiffres de largeur égale', () => {
    for (const value of [TABLE_STYLES.cellAmount, TABLE_STYLES.thAmount]) {
      expect(value).toContain('text-right');
      expect(value).toContain('tabular-nums');
    }
  });

  it('laisse respirer les lignes', () => {
    expect(TABLE_STYLES.cellCategory).toContain('py-2.5');
    expect(TABLE_STYLES.cellAmount).toContain('py-2.5');
  });
});
