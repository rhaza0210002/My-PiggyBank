import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(join(process.cwd(), 'src', path), 'utf8');
const css = read('app/globals.css');

describe('cartes vivantes : léger zoom au survol', () => {
  it('grossit un peu au survol (souris seulement) et revient en douceur', () => {
    expect(css).toMatch(/@utility carte-vivante\s*\{[^}]*transition: scale/);
    expect(css).toMatch(/@media \(hover: hover\)[\s\S]*?scale: 1\.02/);
  });

  it('reste immobile pour qui demande moins d’animations', () => {
    expect(css).toMatch(/prefers-reduced-motion: reduce\)[\s\S]*?\.carte-vivante:hover\s*\{\s*scale: none/);
    expect(css).toMatch(/html\[data-calme='oui'\] \.carte-vivante:hover\s*\{\s*scale: none/);
  });

  it('s’applique aux cartes, pas aux cadres de page', () => {
    for (const file of [
      'app/(app)/tableau-de-bord/page.tsx',
      'components/features/dashboard/BalanceCard.tsx',
      'components/features/gamification/MonthRecapCard.tsx',
      'components/features/gamification/StartChecklist.tsx',
      'components/ui/Card.tsx',
      'components/features/reconciliation/ReconcileCard.tsx',
      'components/features/tables/BudgetGroupTable.tsx',
      'components/features/charts/BudgetVsActualDonuts.tsx',
    ]) {
      expect(read(file), file).toContain('carte-vivante');
    }
    expect(read('components/ui/ScreenCard.tsx')).not.toContain('carte-vivante');
  });
});
