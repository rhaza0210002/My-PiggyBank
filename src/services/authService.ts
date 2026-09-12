import { supabase } from '@/lib/supabaseClient';

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
      },
    },
  });

  if (authError) {
    throw new Error(authError.message);
  }

  const user = authData.user;

  if (user) {
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: user.id,
        email: email,
        pseudo: pseudo || null,
      });

    if (profileError) {
      console.error("Erreur lors de la création du profil public :", profileError.message);
      throw new Error(profileError.message);
    }
  }

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
  if (error) {
    throw new Error(error.message);
  }
}

export default {
  registerUser,
  loginUser,
  logoutUser,
};