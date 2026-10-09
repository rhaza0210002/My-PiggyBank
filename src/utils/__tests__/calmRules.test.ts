import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = join(process.cwd(), 'src');

function tsxFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    if (statSync(path).isDirectory()) return name === '__tests__' ? [] : tsxFiles(path);
    return name.endsWith('.tsx') ? [path] : [];
  });
}

const files = tsxFiles(SRC).map((path) => ({ file: relative(SRC, path), content: readFileSync(path, 'utf8') }));

describe('règles de calme', () => {
  it('aucune animation en boucle dans les composants (le clignement du cochon est en CSS, sans boucle)', () => {
    const offenders = files.filter(({ content }) => /\binfinite\b|animate-bounce/.test(content)).map(({ file }) => file);
    expect(offenders).toEqual([]);
  });

  it('les champs de saisie ont un contour à 3:1 (bordure-forte), pas la bordure décorative', () => {
    const offenders = files
      .filter(({ content }) => /<(?:input|select|textarea)\b[^<]{0,600}?className=(?:"|\{`)[^"`]*\bborder-bordure(?![-\w])/.test(content))
      .map(({ file }) => file);
    expect(offenders).toEqual([]);
  });
});
