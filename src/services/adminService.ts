import { supabase } from '@/lib/supabaseClient';

/**
 * Indique si l'utilisateur connecté est administrateur (app_metadata.role = 'admin').
 * Sert uniquement à afficher ou masquer les outils d'administration : l'autorisation réelle
 * est appliquée par les politiques RLS (public.is_admin()).
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.app_metadata?.role === 'admin';
}
