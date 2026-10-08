import { supabase } from '@/lib/supabaseClient';

export interface UserSettings {
  notify_reconcile: boolean;
  notify_budget_overrun: boolean;
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
  notify_reconcile: true,
  notify_budget_overrun: true,
};

/** Préférences de l'utilisateur connecté ; les valeurs par défaut s'appliquent tant qu'il n'a rien enregistré. */
export async function getUserSettings(): Promise<UserSettings> {
  const { data, error } = await supabase
    .from('user_settings')
    .select('notify_reconcile, notify_budget_overrun')
    .maybeSingle();

  if (error) throw new Error(`Lecture des préférences impossible : ${error.message}`);
  return data ?? DEFAULT_USER_SETTINGS;
}

export async function saveUserSettings(settings: UserSettings): Promise<void> {
  const { data, error: authError } = await supabase.auth.getUser();
  if (authError || !data.user) throw new Error('Vous devez être connecté pour enregistrer vos préférences.');

  const { error } = await supabase
    .from('user_settings')
    .upsert({ user_id: data.user.id, ...settings, updated_at: new Date().toISOString() });

  if (error) throw new Error(`Enregistrement des préférences impossible : ${error.message}`);
}
