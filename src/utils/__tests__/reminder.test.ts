import { describe, expect, it } from 'vitest';
import { buildReminderPayload, isAuthorizedCron, isGoneSubscription } from '@/utils/reminder';

describe('texte du rappel', () => {
  it('ne contient que le nombre d’opérations, jamais de donnée bancaire', () => {
    const payload = buildReminderPayload(9);
    expect(payload.body).toContain('9 opérations');
    expect(`${payload.title} ${payload.body}`).not.toMatch(/€|ALDI|CARTE|IBAN/i);
  });

  it('accorde le singulier et mène à la page de pointage', () => {
    const payload = buildReminderPayload(1);
    expect(payload.body).toMatch(/^Une opération/);
    expect(payload.url).toBe('/operations/rapprochement');
  });
});

describe('autorisation de la tâche planifiée', () => {
  it('accepte uniquement le bon secret', () => {
    expect(isAuthorizedCron('Bearer s3cret', 's3cret')).toBe(true);
    expect(isAuthorizedCron('Bearer autre', 's3cret')).toBe(false);
    expect(isAuthorizedCron('s3cret', 's3cret')).toBe(false);
  });

  it('refuse tout quand le secret n’est pas configuré ou l’en-tête absent', () => {
    expect(isAuthorizedCron('Bearer ', '')).toBe(false);
    expect(isAuthorizedCron(null, 's3cret')).toBe(false);
    expect(isAuthorizedCron('Bearer undefined', undefined)).toBe(false);
  });
});

describe('souscription expirée', () => {
  it('reconnaît 404 et 410 seulement', () => {
    expect(isGoneSubscription(410)).toBe(true);
    expect(isGoneSubscription(404)).toBe(true);
    expect(isGoneSubscription(500)).toBe(false);
    expect(isGoneSubscription(undefined)).toBe(false);
  });
});
