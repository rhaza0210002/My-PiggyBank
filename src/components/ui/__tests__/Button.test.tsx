import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import Button from '@/components/ui/Button';

describe('Button', () => {
  it.each(['principal', 'secondaire', 'lien', 'doux'] as const)('la variante %s garde une zone tactile de 44 px', (variant) => {
    expect(renderToStaticMarkup(<Button variant={variant}>Pointer</Button>)).toContain('min-h-11');
  });

  it('est principal par défaut, avec un fond accent et une ombre bonbon', () => {
    const html = renderToStaticMarkup(<Button>Pointer</Button>);
    expect(html).toContain('bg-accent');
    expect(html).toContain('shadow-bonbon');
  });

  it('rend l’attribut disabled et type=button par défaut', () => {
    const html = renderToStaticMarkup(<Button disabled>Pointer</Button>);
    expect(html).toContain('disabled');
    expect(html).toContain('type="button"');
  });
});
