import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import RegisterWelcome from '@/components/features/forms/RegisterWelcome';

const props = { email: 'toi@exemple.fr', onEnter: () => {}, onWrongEmail: () => {} };

describe('RegisterWelcome', () => {
  it('rappelle l’adresse choisie, pour repérer une faute de frappe tout de suite', () => {
    const html = renderToStaticMarkup(<RegisterWelcome {...props} />);
    expect(html).toContain('role="status"');
    expect(html).toContain('<strong>toi@exemple.fr</strong>');
    expect(html).toContain('Entrer dans ma tirelire');
  });

  it('permet de repartir de zéro si l’adresse est fausse', () => {
    const html = renderToStaticMarkup(<RegisterWelcome {...props} />);
    expect(html).toMatch(/<button[^>]*>Ce n’est pas la bonne adresse \?<\/button>/);
  });

  it('montre l’erreur si la suppression échoue', () => {
    const html = renderToStaticMarkup(<RegisterWelcome {...props} error="Suppression impossible." />);
    expect(html).toContain('role="alert"');
    expect(html).toContain('Suppression impossible.');
  });
});
