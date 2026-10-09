import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import Icon, { ICON_NAMES } from '@/components/ui/Icon';

describe('Icon', () => {
  it('dessine chaque icône du jeu en SVG décoratif, à la couleur du texte', () => {
    for (const name of ICON_NAMES) {
      const html = renderToStaticMarkup(<Icon name={name} />);
      expect(html, name).toContain('<svg');
      expect(html, name).toContain('aria-hidden="true"');
      expect(html, name).toContain('stroke="currentColor"');
      expect(html, name).not.toMatch(/#[0-9a-fA-F]{3,8}/);
    }
  });

  it('couvre le menu et les titres de pages', () => {
    for (const name of ['home', 'budget', 'operations', 'account', 'import', 'chart', 'calendar', 'target', 'lock', 'coins', 'folder', 'flask', 'archive', 'settings', 'bell'] as const) {
      expect(ICON_NAMES).toContain(name);
    }
  });
});
