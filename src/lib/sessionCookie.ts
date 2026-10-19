import type { CookieOptions } from '@supabase/ssr';

/**
 * Durée de vie du cookie de session : 24 h sans utiliser l'app et il faut se reconnecter.
 * @supabase/ssr impose 400 jours et ignore `cookieOptions.maxAge`, d'où cette réécriture à chaque dépôt.
 * Le cookie est réécrit à chaque renouvellement du jeton (environ toutes les heures d'utilisation) :
 * le délai repart donc de zéro tant que l'app sert.
 */
export const SESSION_MAX_AGE_SECONDS = 24 * 60 * 60;

/** Garde l'effacement tel quel (maxAge 0), raccourcit tout le reste. */
export function withSessionMaxAge<T extends CookieOptions>(options: T): T {
  return options.maxAge === 0 ? options : { ...options, maxAge: SESSION_MAX_AGE_SECONDS };
}
