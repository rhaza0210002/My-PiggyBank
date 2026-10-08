import { supabase } from '@/lib/supabaseClient';

/**
 * Identifiant de l'utilisateur connecté, lu dans la session locale (sans aller-retour réseau).
 * Les règles RLS de la base restent la vraie barrière : cet identifiant ne sert qu'à filtrer.
 */
export async function requireUserId(message: string): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user.id;
  if (!userId) throw new Error(message);
  return userId;
}
