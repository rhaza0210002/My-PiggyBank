import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const APP = join(process.cwd(), 'src/app/(app)');

function pageDirs(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    if (!statSync(path).isDirectory()) return [];
    return [...(existsSync(join(path, 'page.tsx')) ? [path] : []), ...pageDirs(path)];
  });
}

/** Titre déclaré par la page ou par le layout de son dossier (WCAG 2.4.2 : un titre propre à chaque page). */
function titleOf(directory: string): string | undefined {
  for (const file of ['page.tsx', 'layout.tsx']) {
    const path = join(directory, file);
    if (!existsSync(path)) continue;
    const match = readFileSync(path, 'utf8').match(/metadata[^=]*=\s*\{\s*title:\s*'([^']+)'/);
    if (match) return match[1];
  }
  return undefined;
}

describe('titres de page', () => {
  const dirs = pageDirs(APP);

  it.each(dirs.map((dir) => [dir.replace(APP, '')]))('%s a son propre titre', (relative) => {
    expect(titleOf(join(APP, relative))).toBeTruthy();
  });

  it('aucun titre n’est partagé par deux pages', () => {
    const titles = dirs.map(titleOf);
    expect(new Set(titles).size).toBe(titles.length);
  });
});
