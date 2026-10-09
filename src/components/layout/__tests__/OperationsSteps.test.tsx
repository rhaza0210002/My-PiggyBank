import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

const pathname = vi.hoisted(() => ({ value: '/operations/depenses-reelles' }));
vi.mock('next/navigation', () => ({ usePathname: () => pathname.value }));

import OperationsSteps from '@/components/layout/OperationsSteps';

describe('OperationsSteps', () => {
  it('est replié par défaut sur le bilan du mois, avec un bouton à flèche', () => {
    pathname.value = '/operations/depenses-reelles';
    const html = renderToStaticMarkup(<OperationsSteps />);
    expect(html).toMatch(/<button[^>]*aria-expanded="false"[^>]*aria-controls="/);
    expect(html).toContain('Étapes');
    expect(html).toContain('▾');
    expect(html).not.toContain('Importer');
  });

  it('reste déplié sur les autres étapes', () => {
    pathname.value = '/operations/import';
    const html = renderToStaticMarkup(<OperationsSteps />);
    expect(html).not.toContain('<button');
    expect(html).toContain('Importer');
    expect(html).toContain('Pointer');
  });
});
