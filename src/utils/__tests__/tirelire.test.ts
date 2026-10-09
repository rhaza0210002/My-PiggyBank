import { describe, expect, it } from 'vitest';
import { DAILY_GOAL, tirelireLevel } from '@/utils/tirelire';

describe('tirelireLevel', () => {
  it('monte avec les pointages du jour', () => {
    expect(tirelireLevel(0)).toBe(0);
    expect(tirelireLevel(3)).toBeCloseTo(0.3);
    expect(tirelireLevel(DAILY_GOAL)).toBe(1);
  });

  it('reste plafonné à 1 quand il y a plus de pointages que l’objectif', () => {
    expect(tirelireLevel(25)).toBe(1);
  });

  it('ne descend jamais sous 0, même avec une valeur négative', () => {
    expect(tirelireLevel(-2)).toBe(0);
  });

  it('vaut 0 quand l’objectif est nul, sans diviser par zéro', () => {
    expect(tirelireLevel(3, 0)).toBe(0);
  });

  it('a un objectif par défaut de 10 pointages', () => {
    expect(DAILY_GOAL).toBe(10);
  });
});
