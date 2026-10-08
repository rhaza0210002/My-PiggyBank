import { timingSafeEqual } from 'node:crypto';
import { ROUTES } from '@/constants/routes';

export interface ReminderPayload {
  title: string;
  body: string;
  url: string;
}

/**
 * Texte du rappel : bienveillant, sans pression, et surtout sans aucune donnée bancaire
 * (ni libellé, ni montant, ni catégorie) : seulement un nombre d'opérations.
 */
export function buildReminderPayload(pendingCount: number): ReminderPayload {
  const plural = pendingCount > 1;
  return {
    title: 'My PiggyBank',
    body: plural
      ? `${pendingCount} opérations t’attendent. Une à la fois, à ton rythme.`
      : 'Une opération t’attend. Une seule, ça se fait en un instant.',
    url: ROUTES.reconciliation,
  };
}

/**
 * Alerte de dépassement : seulement le NOMBRE de catégories, jamais leur nom ni un montant, car une notification
 * s'affiche sur un écran verrouillé. Ton factuel, sans culpabiliser.
 */
export function buildOverrunPayload(overrunCount: number): ReminderPayload {
  return {
    title: 'My PiggyBank',
    body:
      overrunCount > 1
        ? `${overrunCount} catégories dépassent leur budget ce mois-ci. Un coup d’œil quand tu veux, rien d’urgent.`
        : 'Une catégorie dépasse son budget ce mois-ci. Un coup d’œil quand tu veux, rien d’urgent.',
    url: ROUTES.actualExpenses,
  };
}

/** Vérifie l'en-tête `Authorization: Bearer <secret>` envoyé par la tâche planifiée, en temps constant. */
export function isAuthorizedCron(authorizationHeader: string | null, secret: string | undefined): boolean {
  if (!secret || !authorizationHeader) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(authorizationHeader);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

/** Une souscription Web Push expirée ou révoquée renvoie 404 ou 410 : on la supprime plutôt que de réessayer. */
export function isGoneSubscription(statusCode: number | undefined): boolean {
  return statusCode === 404 || statusCode === 410;
}
