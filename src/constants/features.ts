/**
 * Connexion Google : masquée tant que le fournisseur n'est pas activé dans Supabase (Authentication → Providers),
 * sinon le bouton mènerait à une page d'erreur. Mettre NEXT_PUBLIC_GOOGLE_AUTH=on une fois configuré.
 */
export function isGoogleAuthEnabled(): boolean {
  return process.env.NEXT_PUBLIC_GOOGLE_AUTH === 'on';
}
