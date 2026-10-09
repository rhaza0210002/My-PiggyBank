import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { NAV_SECTIONS } from '@/constants/routes';
import { ICON_NAMES } from '@/components/ui/Icon';

const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;

function tsxFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    if (statSync(path).isDirectory()) return name === '__tests__' ? [] : tsxFiles(path);
    return path.endsWith('.tsx') ? [path] : [];
  });
}

describe('icônes dessinées plutôt qu’émojis', () => {
  it('le menu utilise le jeu d’icônes', () => {
    for (const section of NAV_SECTIONS) expect(ICON_NAMES).toContain(section.icon);
  });

  it('aucun titre de page (ScreenCard icon=…) n’est un émoji', () => {
    const offenders = tsxFiles(join(process.cwd(), 'src')).filter((path) =>
      [...readFileSync(path, 'utf8').matchAll(/\bicon="([^"]*)"/g)].some(([, value]) => EMOJI.test(value)),
    );
    expect(offenders).toEqual([]);
  });
});
