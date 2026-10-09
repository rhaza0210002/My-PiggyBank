import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import Card from '@/components/ui/Card';

describe('Card', () => {
  it('utilise les rôles surface, contour d’encre et arrondi carte', () => {
    const html = renderToStaticMarkup(<Card>Contenu</Card>);
    expect(html).toContain('bg-surface');
    expect(html).toContain('border-texte');
    expect(html).toContain('rounded-carte');
    expect(html).toContain('Contenu');
  });

  it('peut être une section', () => {
    expect(renderToStaticMarkup(<Card as="section">x</Card>)).toMatch(/^<section/);
  });
});
