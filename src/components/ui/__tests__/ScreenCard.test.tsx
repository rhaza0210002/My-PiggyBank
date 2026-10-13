import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import ScreenCard, { ScreenPanel } from '@/components/ui/ScreenCard';

describe('ScreenCard ajustée à son contenu (fit)', () => {
  const html = renderToStaticMarkup(
    <ScreenCard fit title="Bilan du mois">
      <p>Totaux</p>
    </ScreenCard>,
  );

  it('ne prend pas toute la hauteur de l’écran et ne défile pas en interne', () => {
    expect(html).not.toContain('h-full');
    expect(html).not.toContain('overflow-y-auto');
    expect(html).not.toContain('flex-1');
  });
});

describe('ScreenPanel : une carte à part entière qui suit la première', () => {
  const html = renderToStaticMarkup(
    <ScreenPanel label="Détail du mois" className="md:h-[100cqh]">
      <p>Détail</p>
    </ScreenPanel>,
  );

  it('porte le même contour et la même ombre que le cadre de page', () => {
    expect(html).toContain('rounded-carte');
    expect(html).toContain('border-texte');
    expect(html).toContain('shadow-sticker');
  });

  it('est une région nommée, atteignable au clavier', () => {
    expect(html).toMatch(/<section[^>]*aria-label="Détail du mois"/);
    expect(html).toContain('tabindex="-1"');
  });

  it('reçoit la hauteur voulue par la page', () => {
    expect(html).toContain('md:h-[100cqh]');
  });

  it('n’affiche son contenu qu’à l’arrivée, avec une apparition coupée si le mouvement est réduit', () => {
    expect(html).not.toContain('Détail</p>');
    expect(html).toContain('motion-reduce:transition-none');
  });
});
