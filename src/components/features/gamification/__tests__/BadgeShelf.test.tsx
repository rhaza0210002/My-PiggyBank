import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import BadgeShelf from '@/components/features/gamification/BadgeShelf';

const badges = [
  { id: 'catch-up', label: 'Rattrapage réussi', description: 'Terminer un mois passé', earned: false },
  { id: 'ten-operations', label: 'Dix pointages', description: 'Pointer 10 opérations', earned: true },
];

describe('BadgeShelf', () => {
  it('laisse les libellés longs passer à la ligne au lieu de déborder de leur tuile', () => {
    const html = renderToStaticMarkup(<BadgeShelf badges={badges} />);
    expect(html).toContain('min-w-0');
    expect(html).toContain('[overflow-wrap:anywhere]');
  });

  it('donne à chaque tuile une largeur minimale confortable sur ordinateur (colonnes qui se replient)', () => {
    expect(renderToStaticMarkup(<BadgeShelf badges={badges} />)).toContain('md:grid-cols-[repeat(auto-fit,minmax(5.5rem,1fr))]');
  });

  it('garde le texte lisible aux lecteurs d’écran', () => {
    expect(renderToStaticMarkup(<BadgeShelf badges={badges} />)).toContain('Rattrapage réussi : à débloquer');
  });
});
