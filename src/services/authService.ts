import { supabase } from '@/lib/supabaseClient';
import { clearLocalPersonalData } from '@/services/personalDataService';
import { TERMS_VERSION } from '@/constants/legal';

export interface AuthCredentials {
  email: string;
  password: string;
  pseudo?: string;
}

/**
 * Inscrit un nouvel utilisateur via Supabase Auth et l'enregistre dans public.users
 */
export async function registerUser({ email, password, pseudo }: AuthCredentials) {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        pseudo: pseudo,
        // Preuve d'acceptation des conditions et de la politique de confidentialité.
        terms_accepted_at: new Date().toISOString(),
        terms_version: TERMS_VERSION,
      },
    },
  });

  if (authError) {
    throw new Error(authError.message);
  }

  // Le profil public est créé par le trigger `on_auth_user_created` côté base.
  return authData;
}

/**
 * Connecte un utilisateur existant
 */
export async function loginUser({ email, password }: Omit<AuthCredentials, 'pseudo'>) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Déconnecte l'utilisateur courant
 */
export async function logoutUser() {
  const { error } = await supabase.auth.signOut();
  clearLocalPersonalData();
  if (error) {
    throw new Error(error.message);
  }
}

const authService = {
  registerUser,
  loginUser,
  logoutUser,
};

export default authService;
/**
 * Change le mot de passe de l'utilisateur connecté.
 */
export async function updatePassword(newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) {
    throw new Error(error.message);
  }
}
