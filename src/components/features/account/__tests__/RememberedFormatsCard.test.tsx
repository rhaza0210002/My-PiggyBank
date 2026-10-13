import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { RememberedFormatsView } from '@/components/features/account/RememberedFormatsCard';

const render = (count: number, forgotten = false) =>
  renderToStaticMarkup(<RememberedFormatsView count={count} forgotten={forgotten} onForget={() => {}} />);

describe('Mes données : réglages d’import retenus sur l’appareil', () => {
  it('se présente et explique ce qui est gardé', () => {
    const html = render(2);
    expect(html).toContain('Réglages d’import retenus sur cet appareil');
    expect(html).toContain('aucune opération');
  });

  it('sans réglage retenu : le dit, sans bouton', () => {
    const html = render(0);
    expect(html).toContain('Aucun réglage retenu.');
    expect(html).not.toContain('Oublier');
  });

  it('avec des réglages : le nombre et un bouton Oublier', () => {
    const html = render(2);
    expect(html).toContain('2 formats retenus');
    expect(html).toMatch(/<button[^>]*>Oublier<\/button>/);
    expect(render(1)).toContain('1 format retenu');
  });

  it('confirme l’oubli dans une zone de statut', () => {
    expect(render(0, true)).toMatch(/role="status"[^>]*>C’est oublié\./);
  });
});

describe('Mes données : focus après « Oublier »', () => {
  it('le titre de la carte peut recevoir le focus (le bouton disparaît)', () => {
    const html = renderToStaticMarkup(<RememberedFormatsView count={2} forgotten={false} onForget={() => {}} />);
    expect(html).toMatch(/<h2 id="formats-title"[^>]*tabindex="-1"/);
  });
});
