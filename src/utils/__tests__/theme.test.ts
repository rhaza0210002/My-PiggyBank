import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { contrastRatio } from '@/utils/contrast';

const css = readFileSync(join(process.cwd(), 'src/app/globals.css'), 'utf8');
const themeBlock = css.match(/@theme\s*\{([\s\S]*?)\n\}/)?.[1] ?? '';

/** Valeur hexadécimale d'un rôle de couleur déclaré dans le bloc @theme. */
function role(name: string): string {
  const match = themeBlock.match(new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})`));
  if (!match) throw new Error(`Rôle de couleur absent : ${name}`);
  return match[1];
}

const REQUIRED_ROLES = [
  'fond', 'surface', 'surface-douce', 'bordure', 'bordure-forte', 'texte', 'texte-doux',
  'accent', 'sur-accent', 'accent-fort', 'accent-doux', 'ok', 'ok-fond', 'attention', 'attention-fond',
  'depasse', 'depasse-fond', 'corail', 'corail-clair', 'sur-corail', 'piece', 'piece-bord', 'cochon', 'cochon-bord', 'focus',
];

describe('contrastRatio', () => {
  it('vaut 21 entre noir et blanc et 1 entre deux couleurs identiques', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(contrastRatio('#777777', '#777777')).toBeCloseTo(1, 5);
  });
});

describe('rôles de couleur', () => {
  it.each(REQUIRED_ROLES)('déclare le rôle %s', (name) => {
    expect(role(name)).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  it.each([
    ['texte', 'fond'],
    ['texte', 'surface'],
    ['texte-doux', 'fond'],
    ['texte-doux', 'surface'],
    ['accent-fort', 'fond'],
    ['accent-fort', 'surface'],
    ['sur-accent', 'accent'],
    ['ok', 'ok-fond'],
    ['attention', 'attention-fond'],
    ['depasse', 'depasse-fond'],
    ['accent-fort', 'accent-doux'],
    ['accent-fort', 'surface-douce'],
    ['texte', 'accent-doux'],
    ['texte-doux', 'accent-doux'],
    ['texte-doux', 'surface-douce'],
    ['sur-corail', 'corail'],
    ['sur-corail', 'corail-clair'],
  ])('texte lisible : %s sur %s (4,5:1 minimum)', (foreground, background) => {
    expect(contrastRatio(role(foreground), role(background))).toBeGreaterThanOrEqual(4.5);
  });

  it.each([
    ['bordure-forte', 'surface'],
    ['focus', 'fond'],
  ])('contrôle visible : %s sur %s (3:1 minimum)', (foreground, background) => {
    expect(contrastRatio(role(foreground), role(background))).toBeGreaterThanOrEqual(3);
  });
});

describe('onglet actif en corail', () => {
  it('passe par un seul utilitaire onglet-actif (dégradé + ombrage), défini dans globals.css', () => {
    expect(css).toMatch(/@utility onglet-actif\s*\{[^}]*linear-gradient[^}]*corail-clair[^}]*corail[^}]*box-shadow/);
  });
});
