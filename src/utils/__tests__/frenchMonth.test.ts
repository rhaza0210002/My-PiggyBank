import { describe, expect, it } from 'vitest';
import { ofMonth } from '@/utils/frenchMonth';

describe('ofMonth', () => {
  it('élide devant une voyelle', () => {
    expect(ofMonth('Octobre')).toBe('d’octobre');
    expect(ofMonth('Avril')).toBe('d’avril');
    expect(ofMonth('Août')).toBe('d’août');
  });

  it('garde « de » devant une consonne, en minuscules', () => {
    expect(ofMonth('Septembre')).toBe('de septembre');
    expect(ofMonth('Mai')).toBe('de mai');
  });
});
