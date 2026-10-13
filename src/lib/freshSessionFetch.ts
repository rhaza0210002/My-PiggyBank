/** Réponse de Supabase à un jeton de session périmé ou illisible (PostgREST PGRST301/PGRST303, Storage, fonctions). */
export async function isExpiredSessionResponse(response: Response): Promise<boolean> {
  if (response.status !== 401) return false;
  const body = await response.clone().text().catch(() => '');
  return /jwt|PGRST30[13]/i.test(body);
}

interface FreshSessionOptions {
  /** Renouvelle la session ; renvoie le nouveau jeton d'accès, ou null si elle ne peut plus l'être. */
  refresh: () => Promise<string | null>;
  /** Appelé quand la session est perdue pour de bon (il faut se reconnecter). */
  onSessionLost: () => void;
  baseFetch?: typeof fetch;
}

/**
 * fetch pour le client Supabase du navigateur : si une requête tombe sur un jeton périmé
 * (téléphone sorti de veille, onglet laissé ouvert), la session est renouvelée et la requête rejouée une fois.
 */
export function createFreshSessionFetch({ refresh, onSessionLost, baseFetch = fetch }: FreshSessionOptions): typeof fetch {
  // Plusieurs requêtes refusées en même temps ne déclenchent qu'un seul renouvellement.
  let pending: Promise<string | null> | null = null;
  const renew = () => {
    pending ??= refresh().catch(() => null).finally(() => { pending = null; });
    return pending;
  };

  return async (input, init) => {
    const response = await baseFetch(input, init);
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    // Les appels d'authentification gèrent eux-mêmes leurs jetons (et le renouvellement passe par eux).
    if (url.includes('/auth/v1/') || !(await isExpiredSessionResponse(response))) return response;

    const token = await renew();
    if (!token) {
      onSessionLost();
      return response;
    }
    const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
    headers.set('Authorization', `Bearer ${token}`);
    return baseFetch(input, { ...init, headers });
  };
}
