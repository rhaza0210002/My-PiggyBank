import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import EmptyState from '@/components/ui/EmptyState';

describe('EmptyState', () => {
  it('montre le cochon, un titre et une phrase douce, annoncés comme un statut', () => {
    const html = renderToStaticMarkup(<EmptyState title="Rien ici pour l’instant" text="Importe ton relevé pour commencer." />);
    expect(html).toContain('data-mood="endormi"');
    expect(html).toContain('Rien ici pour l’instant');
    expect(html).toContain('Importe ton relevé pour commencer.');
    expect(html).toContain('role="status"');
  });

  it('propose un lien vers la bonne étape quand on le lui donne', () => {
    const html = renderToStaticMarkup(
      <EmptyState title="Pas encore d’opérations" action={{ href: '/operations/import', label: 'Importer mon relevé' }} />,
    );
    expect(html).toMatch(/<a[^>]*href="\/operations\/import"[^>]*>Importer mon relevé<\/a>/);
  });

  it('peut rester discret dans un tableau (version compacte, sans décor)', () => {
    const html = renderToStaticMarkup(<EmptyState title="Aucune donnée" compact />);
    expect(html).toContain('size-12');
    expect(html).not.toContain('data-deco');
  });
});
