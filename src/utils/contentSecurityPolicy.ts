/**
 * Politique de sécurité du contenu (CSP) : seuls les scripts de l'app, marqués du nonce de la requête, peuvent
 * s'exécuter. Un texte injecté (libellé, pseudo, catégorie…) ne pourra jamais lancer de script, même s'il
 * passait un jour à travers l'affichage. Les données ne partent que vers l'app elle-même et Supabase.
 */
export interface CspOptions {
  nonce: string;
  /** Adresse du projet Supabase (API et temps réel). */
  supabaseUrl: string;
  /** En développement, React a besoin d'eval pour ses messages d'erreur ; jamais en production. */
  isDev: boolean;
  /** Page servie en HTTPS (Vercel, tunnel) : on force aussi le HTTPS des ressources. Pas sur le Wi-Fi local en http. */
  isHttps?: boolean;
}

/** Nonce imprévisible, nouveau à chaque requête. */
export function createNonce(): string {
  return btoa(crypto.randomUUID());
}

export function buildContentSecurityPolicy({ nonce, supabaseUrl, isDev, isHttps = true }: CspOptions): string {
  const supabase = new URL(supabaseUrl).origin;
  const realtime = supabase.replace(/^http/, 'ws');
  const directives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ''}`,
    // Les attributs style posés par React (graphiques, animations) restent permis ; aucun script n'en dépend.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    `connect-src 'self' ${supabase} ${realtime}`,
    "worker-src 'self'",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ];
  if (!isDev && isHttps) directives.push('upgrade-insecure-requests');
  return directives.join('; ');
}
