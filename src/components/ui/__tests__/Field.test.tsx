import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import Field from '@/components/ui/Field';

describe('Field', () => {
  it('relie l’étiquette au champ et l’aide au champ', () => {
    const html = renderToStaticMarkup(
      <Field label="Montant" hint="Tu peux corriger plus tard.">
        {(props) => <input {...props} />}
      </Field>,
    );
    const id = html.match(/<label for="([^"]+)"/)?.[1];
    expect(id).toBeTruthy();
    expect(html).toContain(`id="${id}"`);
    expect(html).toMatch(/aria-describedby="[^"]*"/);
    expect(html).toContain('Tu peux corriger plus tard.');
  });

  it('montre l’erreur avec un mot et la relie au champ', () => {
    const html = renderToStaticMarkup(
      <Field label="Montant" error="Le montant doit être un nombre.">
        {(props) => <input {...props} />}
      </Field>,
    );
    expect(html).toContain('Le montant doit être un nombre.');
    expect(html).toContain('role="alert"');
  });

  it('n’ajoute pas aria-describedby sans aide ni erreur', () => {
    const html = renderToStaticMarkup(<Field label="Montant">{(props) => <input {...props} />}</Field>);
    expect(html).not.toContain('aria-describedby');
  });
});
