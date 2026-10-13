import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import SectionStack, { ownsScroll, withFirstRevealed } from '@/components/ui/SectionStack';
import { softSnapTarget } from '@/utils/scroll';

const sections = [
  { id: 'un', label: 'Décaissement', content: <p>Premier tableau</p> },
  { id: 'deux', label: 'Réserve', content: <p>Second tableau</p> },
];

describe('SectionStack : cartes qui se suivent sur ordinateur', () => {
  const html = renderToStaticMarkup(<SectionStack sections={sections} label="Parties du budget" fillZone />);

  it('laisse de la marge sur les côtés : une carte grossie au survol n’est pas rognée', () => {
    // Une carte grossit de 2 % au survol (≈ 11 px de chaque côté) : 12 px de marge, et jamais de barre horizontale.
    expect(html).toMatch(/md:px-3[^"]*md:overflow-y-auto/);
    expect(html).toContain('md:overflow-x-hidden');
  });

  it('n’utilise pas l’accroche CSS, qui ramenait en arrière à chaque petit cran de molette', () => {
    expect(html).not.toContain('snap-');
  });

  it('au bout des cartes, ne fait pas défiler toute la page', () => {
    expect(html).toContain('md:overscroll-contain');
  });

  it('imbriquée dans une autre zone (bilan), laisse la molette passer à celle-ci au bout des cartes', () => {
    const nested = renderToStaticMarkup(<SectionStack sections={sections} label="Détail" fillZone nested />);
    expect(nested).not.toContain('overscroll-contain');
  });

  it('donne à chaque carte la hauteur de son contenu : pas de grand vide sous une carte courte', () => {
    expect(html).not.toContain('100cqh');
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

  it('ne défile pas toute seule dans la carte : un seul défilement, sinon le bloc suivant reste un grand blanc', () => {
    expect(html).not.toContain('overflow-y-auto');
  });

  it('guette l’arrivée des blocs dans la fenêtre, pas dans une zone qui ne défile pas', () => {
    expect(ownsScroll(false, true)).toBe(false);
    expect(ownsScroll(false, false)).toBe(false);
    expect(ownsScroll(true, false)).toBe(false);
    expect(ownsScroll(true, true)).toBe(true);
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

describe('SectionStack : bloc court (formulaire)', () => {
  const withShort = [...sections, { id: 'ajout', label: 'Ajouter une ligne', content: <form />, fit: true }];
  const html = renderToStaticMarkup(<SectionStack sections={withShort} label="Parties du budget" fillZone />);
  const short = html.slice(html.indexOf('id="section-ajout"'));

  it('prend la hauteur de son contenu, sans grand vide en dessous', () => {
    expect(short.slice(0, short.indexOf('</section>'))).not.toContain('min-h-[calc(100cqh');
  });

  it('garde une place d’attente tant qu’il n’est pas monté (sinon il ne serait jamais « atteint »)', () => {
    const block = short.slice(0, short.indexOf('</section>'));
    expect(block).toContain('min-h-40');
  });
});

describe('softSnapTarget : accroche douce', () => {
  // Débuts de cartes à 0, 430, 860 ; zone de 430 px de haut : on se cale à moins de 64,5 px d'un début.
  const starts = [0, 430, 860];

  it('laisse lire au milieu d’une carte, même à petits crans', () => {
    expect(softSnapTarget(starts, 100, 430, 1200)).toBeNull();
    expect(softSnapTarget(starts, 200, 430, 1200)).toBeNull();
  });

  it('se cale sur le début de carte tout proche, devant ou derrière', () => {
    expect(softSnapTarget(starts, 380, 430, 1200)).toBe(430);
    expect(softSnapTarget(starts, 470, 430, 1200)).toBe(430);
  });

  it('n’annule jamais un cran de molette, même dans une zone très haute', () => {
    expect(softSnapTarget([0, 367], 100, 668, 367)).toBeNull();
    expect(softSnapTarget([0, 367], 300, 668, 367)).toBeNull();
    expect(softSnapTarget([0, 367], 320, 668, 367)).toBe(367);
  });

  it('ne bouge pas quand on y est déjà', () => {
    expect(softSnapTarget(starts, 431, 430, 1200)).toBeNull();
  });

  it('ne vise jamais au-delà de la fin de la zone', () => {
    expect(softSnapTarget(starts, 790, 430, 800)).toBe(800);
    expect(softSnapTarget([0, 860], 760, 430, 800)).toBe(800);
    expect(softSnapTarget([0, 860], 600, 430, 800)).toBeNull();
  });
});
