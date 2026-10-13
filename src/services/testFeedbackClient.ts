import { FEEDBACK_ROUTE, isTestSessionEnabled, type FeedbackKind } from '@/utils/testFeedback';

interface Outgoing {
  kind: Exclude<FeedbackKind, 'erreur-serveur'>;
  message: string;
  who?: string;
  stack?: string;
}

/** Envoie un retour de séance de test. Renvoie false si l'envoi a échoué (jamais d'exception). */
export async function sendFeedback(feedback: Outgoing): Promise<boolean> {
  if (!isTestSessionEnabled()) return false;
  try {
    const response = await fetch(FEEDBACK_ROUTE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({
        ...feedback,
        page: window.location.pathname,
        device: `${navigator.userAgent.slice(0, 150)} · ${window.innerWidth}×${window.innerHeight}`,
      }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

const MAX_ERRORS_PER_PAGE = 20;
const recentErrors = new Map<string, number>();
let sentErrors = 0;

/** Note une erreur du navigateur ; la même erreur répétée en boucle n'est envoyée qu'une fois toutes les 10 s. */
export function reportClientError(error: unknown): void {
  if (!isTestSessionEnabled() || sentErrors >= MAX_ERRORS_PER_PAGE) return;
  const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  const now = Date.now();
  if (now - (recentErrors.get(message) ?? 0) < 10_000) return;
  recentErrors.set(message, now);
  sentErrors += 1;
  const stack = error instanceof Error ? error.stack?.split('\n').slice(0, 8).join('\n') : undefined;
  void sendFeedback({ kind: 'erreur', message, stack });
}

/** Note un message d'erreur montré à l'écran (zones role="alert") : l'app a géré l'erreur, mais le testeur l'a vue. */
export function reportDisplayedError(text: string): void {
  const message = text.replace(/\s+/g, ' ').trim();
  if (message) reportClientError(`Affiché à l’écran : ${message}`);
}
