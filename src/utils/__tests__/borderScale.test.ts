import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Échelle des contours : 2 px pour les cartes, boutons et pastilles (le trait « autocollant »),
 * 1,5 px pour les champs et sous-blocs. Le 1 px n'existe que pour les filets de séparation (border-t / border-b).
 */
const SRC = join(process.cwd(), 'src');
const OFF_SCALE = /(?:^|[\s"'`:])(?:border|border-\[(?:1|2|2\.5|3|4)px\]|border-[34])(?=[\s"'`]|$)/;

function sourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    if (statSync(path).isDirectory()) return name === '__tests__' ? [] : sourceFiles(path);
    return /\.tsx$/.test(name) ? [path] : [];
  });
}

describe('échelle des contours', () => {
  it('n’utilise que 2 px (blocs) ou 1,5 px (champs) pour le contour complet d’un bloc', () => {
    const offenders = sourceFiles(SRC)
      .filter((path) => OFF_SCALE.test(readFileSync(path, 'utf8')))
      .map((path) => relative(SRC, path));
    expect(offenders).toEqual([]);
  });
});
