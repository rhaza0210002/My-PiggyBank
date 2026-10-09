import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import SectionStack, { withFirstRevealed } from '@/components/ui/SectionStack';

const sections = [
  { id: 'un', label: 'Décaissement', content: <p>Premier tableau</p> },
  { id: 'deux', label: 'Réserve', content: <p>Second tableau</p> },
];

describe('SectionStack : cartes qui se suivent sur ordinateur', () => {
  const html = renderToStaticMarkup(<SectionStack sections={sections} label="Parties du budget" fillZone />);

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

describe('SectionStack sans zone de hauteur fixe (import de relevé)', () => {
  const html = renderToStaticMarkup(<SectionStack sections={sections} label="Parties de l’import" />);

  it('ne contraint pas la hauteur : pas de conteneur de taille, pas d’accroche ni de carte plein cadre', () => {
    expect(html).not.toContain('container-type');
    expect(html).not.toContain('snap-');
    expect(html).not.toContain('100cqh');
  });
});

describe('withFirstRevealed', () => {
  it('révèle toujours le premier bloc, même quand les blocs arrivent après le premier affichage', () => {
    const later = withFirstRevealed(new Set(), sections);
    expect([...later]).toEqual(['un']);
  });

  it('garde ce qui est déjà révélé et ne change rien quand il n’y a aucun bloc', () => {
    expect([...withFirstRevealed(new Set(['deux']), sections)].sort()).toEqual(['deux', 'un']);
    expect([...withFirstRevealed(new Set(), [])]).toEqual([]);
  });
});
