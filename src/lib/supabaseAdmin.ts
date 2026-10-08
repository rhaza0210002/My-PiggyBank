import { createClient } from '@supabase/supabase-js';

/**
 * Client « service » : contourne la sécurité par ligne. À n'utiliser QUE côté serveur (tâches planifiées),
 * jamais dans un composant : la clé n'a pas le préfixe NEXT_PUBLIC_, elle ne part donc pas au navigateur.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error('Configuration serveur Supabase manquante.');

  return createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
}
