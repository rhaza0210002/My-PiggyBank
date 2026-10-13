import { describe, expect, it } from 'vitest';
import { DEFAULT_FORM, describeChanges, workshopVariables, type WorkshopSettings } from '@/components/dev/workshopSettings';

const base: WorkshopSettings = { colors: { fond: 'rgb(1 2 3)', accent: 'rgb(4 5 6)' }, ...DEFAULT_FORM };

describe('atelier de l’identité graphique', () => {
  it('réécrit les variables du thème utilisées par Tailwind', () => {
    const variables = workshopVariables(base);
    expect(variables['--color-fond']).toBe('rgb(1 2 3)');
    expect(variables['--color-accent']).toBe('rgb(4 5 6)');
    expect(variables['--radius-carte']).toBe('1.5rem');
    expect(variables['--font-sans']).toContain('--font-nunito');
    expect(variables['--font-titre']).toContain('--font-baloo');
  });

  it('ne pose pas de variable pour une couleur pas encore lue', () => {
    expect(workshopVariables(base)).not.toHaveProperty('--color-corail');
  });

  it('décrit chaque changement en mots', () => {
    const after = { ...base, colors: { ...base.colors, accent: 'rgb(9 9 9)' }, radiusCard: 2, fontText: 'luciole' as const };
    expect(describeChanges(base, after)).toEqual([
      'Vert (accent) (accent) : rgb(9 9 9)',
      'Arrondi des cartes : 2rem',
      'Police du texte : luciole',
    ]);
  });
});
