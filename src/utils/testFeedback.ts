/**
 * Retours de la séance de test entre amis : erreurs captées automatiquement et signalements écrits à la main.
 * Tout est vérifié et borné ici avant d'être écrit dans un fichier local (jamais en base, jamais chez un tiers).
 */

/** Allumé seulement par le script de séance de test (`yarn seance-test`). */
export const isTestSessionEnabled = (): boolean => process.env.NEXT_PUBLIC_TEST_SESSION === 'on';

export const FEEDBACK_ROUTE = '/api/retours';

/** Prénom laissé par la personne qui teste, gardé dans le navigateur pour ne pas le redemander. */
export const TESTER_NAME_KEY = 'piggy-testeur';

export type FeedbackKind = 'erreur' | 'signalement' | 'erreur-serveur';

export interface Feedback {
  kind: FeedbackKind;
  /** Texte écrit par la personne, ou message de l'erreur. */
  message: string;
  /** Chemin de la page, sans paramètres (ils peuvent contenir un jeton). */
  page: string;
  /** Prénom laissé par la personne, facultatif. */
  who?: string;
  /** Premières lignes de la pile d'appels, pour retrouver l'erreur. */
  stack?: string;
  device?: string;
}

const LIMITS = { message: 2000, page: 200, who: 40, stack: 1500, device: 200 } as const;
/** Taille maximale d'une requête : au-delà, refusée sans être lue. */
export const MAX_FEEDBACK_BYTES = 8 * 1024;

/** Retire les caractères de contrôle (sauf retour à la ligne si permis) et coupe à la longueur maximale. */
function clean(value: unknown, max: number, keepNewlines = false): string | undefined {
  if (typeof value !== 'string') return undefined;
  const pattern = keepNewlines ? /[\u0000-\u0009\u000b-\u001f\u007f]/g : /[\u0000-\u001f\u007f]/g;
  const text = value.replace(pattern, ' ').trim().slice(0, max);
  return text === '' ? undefined : text;
}

/** Garde seulement le chemin : « /operations/import?code=… » devient « /operations/import ». */
function cleanPage(value: unknown): string {
  const page = clean(value, LIMITS.page) ?? '/';
  const path = page.split(/[?#]/)[0];
  return /^\/[\w\-/]*$/.test(path) ? path : '/';
}

/** Retour accepté et nettoyé, ou null s'il est mal formé. */
export function sanitizeFeedback(input: unknown): Feedback | null {
  if (typeof input !== 'object' || input === null) return null;
  const raw = input as Record<string, unknown>;
  if (raw.kind !== 'erreur' && raw.kind !== 'signalement') return null;
  const message = clean(raw.message, LIMITS.message, true);
  if (!message) return null;
  return {
    kind: raw.kind,
    message,
    page: cleanPage(raw.page),
    who: clean(raw.who, LIMITS.who),
    stack: clean(raw.stack, LIMITS.stack, true),
    device: clean(raw.device, LIMITS.device),
  };
}

/** Limite d'envois par appareil : une boucle d'erreurs ou un abus ne remplit pas le disque. */
export function createRateLimiter(limit: number, windowMs: number) {
  const hits = new Map<string, number[]>();
  return (key: string, now: number): boolean => {
    const recent = (hits.get(key) ?? []).filter((time) => now - time < windowMs);
    if (recent.length >= limit) {
      hits.set(key, recent);
      return false;
    }
    recent.push(now);
    hits.set(key, recent);
    if (hits.size > 5000) hits.clear();
    return true;
  };
}
