import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import AccessibilityFlower from '@/components/features/accessibility/AccessibilityFlower';

describe('AccessibilityFlower', () => {
  const html = renderToStaticMarkup(<AccessibilityFlower />);

  it('montre un bouton nommé, fermé au départ', () => {
    expect(html).toMatch(/<button[^>]*aria-label="Accessibilité"[^>]*aria-expanded="false"/);
  });

  it('propose les cinq pétales, chacun avec son nom et son état', () => {
    ['Police lisible (Luciole)', 'Contraste renforcé', 'Moins d’animations', 'Lettres plus espacées'].forEach((name) => {
      expect(html).toContain(`aria-label="${name}"`);
      expect(html).toContain(`data-tip="${name}"`);
    });
    expect(html.match(/aria-pressed="false"/g)).toHaveLength(4);
  });

  it('propose deux pétales de zoom nommés avec le niveau, le « moins » étant déjà au minimum', () => {
    expect(html).toContain('aria-label="Agrandir le texte (zoom actuel 100 %)"');
    expect(html).toMatch(/aria-label="Réduire le texte \(zoom actuel 100 %\)"[^>]*disabled=""/);
    expect(html).not.toMatch(/aria-label="Agrandir le texte[^>]*disabled=""/);
  });

  it('peut être retiré : repère data-fleur et croix nommée, hors du clavier tant que la fleur est fermée', () => {
    expect(html).toContain('data-fleur');
    expect(html).toMatch(/aria-label="Retirer le bouton accessibilité"[^>]*tabindex="-1"/);
  });

  it('garde les pétales hors du clavier tant que la fleur est fermée', () => {
    expect(html.match(/tabindex="-1"/g)).toHaveLength(7);
  });
});
