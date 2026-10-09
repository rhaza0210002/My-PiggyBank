import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import Pig from '@/components/ui/Pig';

describe('Pig', () => {
  it('est décoratif par défaut : caché des lecteurs d’écran', () => {
    expect(renderToStaticMarkup(<Pig />)).toContain('aria-hidden="true"');
  });

  it('reçoit un nom accessible quand il porte un sens', () => {
    const html = renderToStaticMarkup(<Pig label="Cochon content" />);
    expect(html).toContain('role="img"');
    expect(html).toContain('aria-label="Cochon content"');
    expect(html).not.toContain('aria-hidden');
  });

  it('change d’expression : yeux ouverts, fermés (solde caché) ou grands ouverts (oups)', () => {
    const content = renderToStaticMarkup(<Pig mood="content" />);
    const endormi = renderToStaticMarkup(<Pig mood="endormi" />);
    const oups = renderToStaticMarkup(<Pig mood="oups" />);
    expect(new Set([content, endormi, oups]).size).toBe(3);
    expect(endormi).toContain('data-mood="endormi"');
  });

  it('n’utilise que les couleurs du thème (jamais de valeur en dur)', () => {
    expect(renderToStaticMarkup(<Pig />)).not.toMatch(/#[0-9a-fA-F]{3,8}|rgb/);
  });
});
