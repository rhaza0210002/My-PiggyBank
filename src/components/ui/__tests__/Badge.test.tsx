import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import Badge from '@/components/ui/Badge';

describe('Badge', () => {
  it.each([
    ['ok', '✓'],
    ['attention', '●'],
    ['depasse', '▲'],
    ['piece', '🪙'],
  ] as const)('le ton %s ajoute l’icône %s et garde le texte', (tone, icon) => {
    const html = renderToStaticMarkup(<Badge tone={tone}>Dans le budget</Badge>);
    expect(html).toContain(icon);
    expect(html).toContain('Dans le budget');
    expect(html).toContain('aria-hidden="true"');
  });
});
