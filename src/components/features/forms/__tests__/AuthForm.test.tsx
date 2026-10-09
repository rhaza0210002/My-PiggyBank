import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import AuthForm, { passwordRuleMet } from '@/components/features/forms/AuthForm';

const register = (props: Partial<Parameters<typeof AuthForm>[0]> = {}) =>
  renderToStaticMarkup(<AuthForm mode="register" onSubmit={() => {}} {...props} />);

describe('inscription sans double saisie', () => {
  it('ne demande le mot de passe qu’une fois', () => {
    const html = register();
    expect(html).not.toContain('Confirmer le mot de passe');
    expect(html.match(/type="password"/g)).toHaveLength(1);
  });

  it('propose de voir le mot de passe juste sous le champ, pour vérifier sa saisie', () => {
    const html = register();
    const field = html.indexOf('id="auth-password"');
    const toggle = html.indexOf('Afficher le mot de passe pour le vérifier');
    expect(toggle).toBeGreaterThan(field);
    expect(toggle).toBeLessThan(html.indexOf('J’accepte'));
  });

  it('annonce la règle des 8 caractères en direct', () => {
    expect(register()).toMatch(/aria-live="polite"[^>]*>[^<]*Au moins 8 caractères/);
    expect(passwordRuleMet('1234567')).toBe(false);
    expect(passwordRuleMet('12345678')).toBe(true);
  });

  it('n’affiche le bouton Google que si on le lui donne', () => {
    expect(register()).not.toContain('Google');
    expect(register({ onGoogle: () => {} })).toContain('S’inscrire avec Google');
  });
});
