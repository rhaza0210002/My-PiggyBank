import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = join(process.cwd(), 'src');
const HARD_CODED_COLOR = /#[0-9a-fA-F]{3,8}\b|rgba?\(/;

/** Données de couleur (palette des groupes de budget, graphiques, manifeste) : hors des rôles du thème. */
const DATA_FILES = [
  'constants/budgetGroupPalette.ts',
  'constants/tableStyles.ts',
  'app/manifest.ts',
  'app/layout.tsx',
  'components/features/forms/GoogleLogo.tsx',
  'app/(legal)/mentions-legales/page.tsx', // adresse postale « #4133 », pas une couleur
];
const DATA_DIRS = ['components/features/charts/'];

function sourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    if (statSync(path).isDirectory()) return name === '__tests__' ? [] : sourceFiles(path);
    return /\.(tsx?|css)$/.test(name) && !/\.test\.tsx?$/.test(name) ? [path] : [];
  });
}

function hasHardCodedColor(path: string): boolean {
  let content = readFileSync(path, 'utf8');
  // Le bloc @theme est l'endroit où les rôles reçoivent leur valeur.
  if (path.endsWith('globals.css')) content = content.replace(/@theme\s*\{[\s\S]*?\n\}/, '');
  return HARD_CODED_COLOR.test(content);
}

const checked = sourceFiles(SRC)
  .map((path) => relative(SRC, path))
  .filter((file) => !DATA_FILES.includes(file) && !DATA_DIRS.some((dir) => file.startsWith(dir)));

describe('couleurs en dur', () => {
  it('aucun fichier ne contient de couleur hexadécimale ou rgba()', () => {
    const offenders = checked.filter((file) => hasHardCodedColor(join(SRC, file)));
    expect(offenders).toEqual([]);
  });

});
