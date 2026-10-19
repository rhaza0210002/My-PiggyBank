import { createBrowserClient, parseCookieHeader, serializeCookieHeader } from '@supabase/ssr';
import { ROUTES } from '@/constants/routes';
import { createFreshSessionFetch } from '@/lib/freshSessionFetch';
import { withSessionMaxAge } from '@/lib/sessionCookie';
import { endDemo } from '@/services/demoStore';
import { invalidateCache } from '@/utils/memoryCache';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Les variables d'environnement Supabase sont manquantes.");
}

// Jeton périmé (sortie de veille, onglet oublié) : session renouvelée et requête rejouée ;
// si ce n'est plus possible, retour à la connexion avec un message clair plutôt qu'une erreur « JWT ».
const freshSessionFetch = createFreshSessionFetch({
  refresh: async () => {
    const { data, error } = await supabase.auth.refreshSession();
    return error ? null : (data.session?.access_token ?? null);
  },
  onSessionLost: () => {
    void supabase.auth.signOut({ scope: 'local' }).finally(() => {
      // Rechargement complet voulu : rien de la session perdue ne doit rester en mémoire.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign(`${ROUTES.login}?erreur=session`);
    });
  },
});

// Client navigateur : la session est stockée dans des cookies pour que le proxy puisse la lire,
// avec la même durée de vie courte que côté serveur (voir sessionCookie).
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
  global: { fetch: freshSessionFetch },
  cookies: {
    getAll: () => parseCookieHeader(document.cookie).map(({ name, value }) => ({ name, value: value ?? '' })),
    setAll: (cookiesToSet) =>
      cookiesToSet.forEach(({ name, value, options }) => {
        document.cookie = serializeCookieHeader(name, value, withSessionMaxAge(options));
      }),
  },
});

// Une autre session ne doit jamais voir les données gardées en mémoire par la précédente.
supabase.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_OUT') {
    invalidateCache();
    endDemo();
  }
});
