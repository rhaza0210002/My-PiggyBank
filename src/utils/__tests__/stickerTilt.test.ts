import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(join(process.cwd(), 'src/app/globals.css'), 'utf8');
const home = readFileSync(join(process.cwd(), 'src/app/(app)/tableau-de-bord/page.tsx'), 'utf8');

describe('cartes penchées (style autocollant)', () => {
  it('se redressent en contraste renforcé', () => {
    expect(css).toMatch(/html\[data-contraste='fort'\] \[data-penche\]\s*\{\s*rotate: none/);
  });

  it('penchent les cartes de l’accueil, et le décor reste invisible aux lecteurs d’écran', () => {
    expect((home.match(/data-penche/g) ?? []).length).toBeGreaterThanOrEqual(3);
    expect(home).toMatch(/data-deco[^>]*aria-hidden="true"|aria-hidden="true"[^>]*data-deco/);
  });
});
