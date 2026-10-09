import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import SectionStack from '@/components/ui/SectionStack';

const sections = [
  { id: 'un', label: 'Décaissement', content: <p>Premier tableau</p> },
  { id: 'deux', label: 'Réserve', content: <p>Second tableau</p> },
];

describe('SectionStack : cartes qui se suivent sur ordinateur', () => {
  const html = renderToStaticMarkup(<SectionStack sections={sections} label="Parties du budget" />);

  it('accroche doucement le défilement sur chaque carte (proximity, jamais mandatory)', () => {
    expect(html).toContain('md:snap-y');
    expect(html).toContain('md:snap-proximity');
    expect(html).not.toContain('snap-mandatory');
  });

  it('aligne chaque carte en haut de la zone, sous la rangée de puces', () => {
    expect(html.match(/md:snap-start/g)).toHaveLength(sections.length);
    expect(html).toContain('scroll-padding-top');
  });

  it('donne à chaque carte au moins la hauteur visible de la zone', () => {
    expect(html.match(/md:min-h-\[calc\(100cqh-var\(--nav-h\)\)\]/g)).toHaveLength(sections.length);
  });

  it('garde une puce par carte, la première marquée comme courante', () => {
    expect(html).toContain('aria-label="Parties du budget"');
    expect(html).toContain('Décaissement');
    expect(html).toMatch(/aria-current="true"[^>]*>Décaissement/);
  });

  it('ne monte que le premier tableau tant qu’on n’y est pas arrivé', () => {
    expect(html).toContain('Premier tableau');
    expect(html).not.toContain('Second tableau');
  });
});
