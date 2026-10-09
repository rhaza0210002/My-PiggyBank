import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import AccessibilityFlower from '@/components/features/accessibility/AccessibilityFlower';

describe('AccessibilityFlower', () => {
  const html = renderToStaticMarkup(<AccessibilityFlower />);

  it('montre un bouton nommé, fermé au départ', () => {
    expect(html).toMatch(/<button[^>]*aria-label="Accessibilité"[^>]*aria-expanded="false"/);
  });

  it('propose les cinq pétales, chacun avec son nom et son état', () => {
    ['Police lisible (Luciole)', 'Texte plus grand', 'Contraste renforcé', 'Moins d’animations', 'Lettres plus espacées'].forEach((name) => {
      expect(html).toContain(`aria-label="${name}"`);
      expect(html).toContain(`data-tip="${name}"`);
    });
    expect(html.match(/aria-pressed="false"/g)).toHaveLength(5);
  });

  it('garde les pétales hors du clavier tant que la fleur est fermée', () => {
    expect(html.match(/tabindex="-1"/g)).toHaveLength(5);
  });
});
