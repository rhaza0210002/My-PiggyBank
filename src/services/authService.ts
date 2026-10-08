import { supabase } from '@/lib/supabaseClient';
import { clearLocalPersonalData } from '@/services/personalDataService';
import { TERMS_VERSION } from '@/constants/legal';
import { AUTH_CALLBACK_ROUTE, RESET_PASSWORD_ROUTE } from '@/constants/routes';

/** Adresse de retour des liens e-mail et de Google ; `next` = page d'arrivée après l'échange du code. */
function callbackUrl(next?: string): string {
  const query = next ? `?next=${encodeURIComponent(next)}` : '';
  return `${window.location.origin}${AUTH_CALLBACK_ROUTE}${query}`;
}

/** Messages d'erreur Supabase en français, sans révéler si une adresse existe. */
export function translateAuthError(message: string): string {
  const text = message.toLowerCase();
  if (text.includes('invalid login credentials')) return 'E-mail ou mot de passe incorrect.';
  if (text.includes('email not confirmed')) {
    return 'Ton adresse e-mail n’est pas encore confirmée. Clique sur le lien reçu par e-mail.';
  }
  if (text.includes('already registered')) return 'Un compte existe déjà avec cette adresse. Connecte-toi.';
  if (text.includes('rate limit') || text.includes('too many')) {
    return 'Trop de tentatives. Patiente quelques minutes avant de réessayer.';
  }
  if (text.includes('same password')) return 'Choisis un mot de passe différent de l’ancien.';
  if (text.includes('weak') || text.includes('pwned') || text.includes('leaked')) {
    return 'Ce mot de passe est trop faible ou a déjà fuité. Choisis-en un autre.';
  }
  if (text.includes('session') && text.includes('missing')) {
    return 'Le lien a expiré. Demande un nouveau lien de réinitialisation.';
  }
  return message;
}

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
      emailRedirectTo: callbackUrl(),
      data: {
        pseudo: pseudo,
        // Preuve d'acceptation des conditions et de la politique de confidentialité.
        terms_accepted_at: new Date().toISOString(),
        terms_version: TERMS_VERSION,
      },
    },
  });

  if (authError) {
    throw new Error(translateAuthError(authError.message));
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
    throw new Error(translateAuthError(error.message));
  }

  return data;
}

/** Connexion ou inscription avec Google : redirige vers Google, puis revient sur le callback. */
export async function signInWithGoogle(): Promise<void> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: callbackUrl() },
  });

  if (error) {
    throw new Error(translateAuthError(error.message));
  }
}

/** Renvoie l'e-mail de confirmation d'inscription. */
export async function resendConfirmationEmail(email: string): Promise<void> {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: { emailRedirectTo: callbackUrl() },
  });

  if (error) {
    throw new Error(translateAuthError(error.message));
  }
}

/** Envoie le lien de réinitialisation. Aucune erreur « compte inconnu » : la réponse ne dit pas si l'adresse existe. */
export async function requestPasswordReset(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: callbackUrl(RESET_PASSWORD_ROUTE),
  });

  if (error && /rate limit|too many/i.test(error.message)) {
    throw new Error(translateAuthError(error.message));
  }
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
  signInWithGoogle,
  resendConfirmationEmail,
  requestPasswordReset,
};

export default authService;
/**
 * Change le mot de passe de l'utilisateur connecté.
 */
export async function updatePassword(newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) {
    throw new Error(translateAuthError(error.message));
  }
}
