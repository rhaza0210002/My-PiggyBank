import { describe, expect, it } from 'vitest';
import { createRateLimiter, sanitizeFeedback } from '@/utils/testFeedback';

describe('sanitizeFeedback', () => {
  it('garde un signalement ordinaire', () => {
    expect(sanitizeFeedback({ kind: 'signalement', message: ' Le bouton ne marche pas ', page: '/budget/mensuel', who: 'Léa' })).toEqual({
      kind: 'signalement',
      message: 'Le bouton ne marche pas',
      page: '/budget/mensuel',
      who: 'Léa',
      stack: undefined,
      device: undefined,
    });
  });

  it('refuse ce qui n’est pas un retour : mauvais type, message vide, autre chose qu’un objet', () => {
    expect(sanitizeFeedback(null)).toBeNull();
    expect(sanitizeFeedback('texte')).toBeNull();
    expect(sanitizeFeedback({ kind: 'admin', message: 'x' })).toBeNull();
    expect(sanitizeFeedback({ kind: 'erreur-serveur', message: 'x' })).toBeNull();
    expect(sanitizeFeedback({ kind: 'signalement', message: '   ' })).toBeNull();
    expect(sanitizeFeedback({ kind: 'signalement', message: 42 })).toBeNull();
  });

  it('coupe les textes trop longs', () => {
    const result = sanitizeFeedback({ kind: 'signalement', message: 'a'.repeat(5000), who: 'b'.repeat(100) });
    expect(result?.message).toHaveLength(2000);
    expect(result?.who).toHaveLength(40);
  });

  it('retire les caractères de contrôle, mais garde les retours à la ligne du message', () => {
    const result = sanitizeFeedback({ kind: 'signalement', message: 'ligne 1\nligne 2\u0007\u001b[31m', who: 'Lé\na' });
    expect(result?.message).toBe('ligne 1\nligne 2  [31m');
    expect(result?.who).toBe('Lé a');
  });

  it('ne garde que le chemin de la page : ni paramètres (jetons), ni adresse inventée', () => {
    expect(sanitizeFeedback({ kind: 'erreur', message: 'x', page: '/auth/callback?code=secret' })?.page).toBe('/auth/callback');
    expect(sanitizeFeedback({ kind: 'erreur', message: 'x', page: 'https://evil.test/' })?.page).toBe('/');
    expect(sanitizeFeedback({ kind: 'erreur', message: 'x', page: '/<script>' })?.page).toBe('/');
  });
});

describe('createRateLimiter', () => {
  it('laisse passer jusqu’à la limite puis refuse, et repart après la fenêtre', () => {
    const allow = createRateLimiter(3, 1000);
    expect([allow('a', 0), allow('a', 1), allow('a', 2), allow('a', 3)]).toEqual([true, true, true, false]);
    expect(allow('b', 3)).toBe(true);
    expect(allow('a', 1500)).toBe(true);
  });
});
