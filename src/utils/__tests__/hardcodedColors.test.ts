import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = join(process.cwd(), 'src');
const HARD_CODED_COLOR = /#[0-9a-fA-F]{3,8}\b|rgba?\(/;
/** Couleurs nommées de Tailwind (bg-white, text-red-700…) : elles aussi doivent passer par un rôle. */
const NAMED_TAILWIND_COLOR =
  /\b(?:bg|text|border|ring|outline|divide|from|via|to|fill|stroke|decoration)-(?:white|black|(?:red|green|amber|yellow|orange|blue|sky|gray|slate|zinc|stone|neutral|emerald|teal|rose|pink|purple|violet|indigo|lime|cyan)-\d{2,3})\b/;

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
  return HARD_CODED_COLOR.test(content) || NAMED_TAILWIND_COLOR.test(content);
}

const checked = sourceFiles(SRC)
  .map((path) => relative(SRC, path))
  .filter((file) => !DATA_FILES.includes(file) && !DATA_DIRS.some((dir) => file.startsWith(dir)));

describe('couleurs en dur', () => {
  it('aucun fichier ne contient de couleur hexadécimale, rgba() ni couleur nommée Tailwind', () => {
    const offenders = checked.filter((file) => hasHardCodedColor(join(SRC, file)));
    expect(offenders).toEqual([]);
  });

});
