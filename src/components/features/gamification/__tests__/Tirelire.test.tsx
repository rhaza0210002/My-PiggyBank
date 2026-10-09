import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import Tirelire from '@/components/features/gamification/Tirelire';

describe('Tirelire', () => {
  it('annonce le niveau du jour en texte et pour les lecteurs d’écran', () => {
    const html = renderToStaticMarkup(<Tirelire pointed={3} tick={0} />);
    expect(html).toContain('3 sur 10');
    expect(html).toContain('role="img"');
    expect(html).toContain('aria-label="Tirelire du jour : 3 sur 10"');
    expect(html).toContain('data-niveau="0.3"');
  });

  it('plafonne le remplissage à 100 % quand il y a plus de pointages que l’objectif', () => {
    const html = renderToStaticMarkup(<Tirelire pointed={25} tick={0} />);
    expect(html).toContain('data-niveau="1"');
  });

  it('ne joue aucune pièce tant qu’aucun pointage n’a eu lieu', () => {
    const html = renderToStaticMarkup(<Tirelire pointed={3} tick={0} />);
    expect(html).not.toContain('tirelire-coin');
    expect(html).not.toContain('+1 pièce');
  });

  it('fait tomber une pièce et annonce « +1 pièce » après un pointage, sans dépendre de l’animation', () => {
    const html = renderToStaticMarkup(<Tirelire pointed={4} tick={1} />);
    expect(html).toContain('tirelire-coin');
    expect(html.indexOf('+1 pièce')).toBeGreaterThan(html.indexOf('role="status"'));
    expect(html).toContain('4 sur 10');
  });

  it('félicite quand la tirelire du jour est pleine', () => {
    const html = renderToStaticMarkup(<Tirelire pointed={10} tick={1} />);
    expect(html).toContain('Tirelire pleine pour aujourd’hui, bravo !');
  });

  it('reste affichée et lisible avec zéro pointage', () => {
    const html = renderToStaticMarkup(<Tirelire pointed={0} tick={0} />);
    expect(html).toContain('0 sur 10');
    expect(html).toContain('data-niveau="0"');
  });

  it('utilise uniquement les rôles du thème pour les couleurs', () => {
    expect(renderToStaticMarkup(<Tirelire pointed={3} tick={1} />)).not.toMatch(/#[0-9a-fA-F]{3,8}|rgba?\(/);
  });
});

describe('Tirelire : annonce répétée', () => {
  it('inclut le compteur dans le message pour que deux pointages de suite soient annoncés', () => {
    const first = renderToStaticMarkup(<Tirelire pointed={3} tick={1} />);
    const second = renderToStaticMarkup(<Tirelire pointed={4} tick={2} />);
    expect(first).toContain('+1 pièce, 3 sur 10');
    expect(second).toContain('+1 pièce, 4 sur 10');
  });
});
