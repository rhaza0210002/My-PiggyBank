/**
 * Séance de test : la base est locale et le tunnel Cloudflare n'expose que l'app. Le navigateur des testeurs
 * joint donc Supabase par l'app elle-même, sous ce chemin (réécriture dans next.config.ts) ; le serveur, lui,
 * garde l'adresse directe.
 */
export const SUPABASE_APP_PATH = '/supabase';

/** Allumé seulement par `yarn seance-test`. */
export const isSupabaseViaApp = (): boolean => process.env.NEXT_PUBLIC_SUPABASE_VIA_APP === 'on';

/** Adresse de Supabase vue du navigateur : directe, ou par l'app pendant une séance de test. */
export function browserSupabaseUrl(directUrl: string, origin: string | null, viaApp: boolean): string {
  return viaApp && origin ? `${origin}${SUPABASE_APP_PATH}` : directUrl;
}

/**
 * Nom du cookie de session, calculé comme @supabase/ssr à partir de l'adresse directe. Le navigateur doit
 * le fixer quand il passe par l'app : sinon il le déduirait de l'adresse du tunnel et le serveur ne le
 * retrouverait pas.
 */
export function sessionCookieName(directUrl: string): string {
  return `sb-${new URL(directUrl).hostname.split('.')[0]}-auth-token`;
}
