import { supabase } from '@/lib/supabaseClient';
import { UserProfileRow } from '@/types/database';

export type UserProfile = UserProfileRow;

/**
 * Récupère le profil de l'utilisateur connecté
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

    if (error) {
        console.error("Erreur lors de la récupération du profil :", error.message);
        throw new Error(error.message);
    }

    return data;
}

/**
 * Met à jour le profil de l'utilisateur connecté
 */
export async function updateUserProfile(userId: string, updates: Pick<UserProfile, 'pseudo'>) {
    const { data, error } = await supabase
        .from('users')
        .update({
                        pseudo: updates.pseudo,
            updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

    if (error) {
        console.error("Erreur lors de la mise à jour du profil :", error.message);
        throw new Error(error.message);
    }

    return data;
}

/**
 * Supprime le profil utilisateur de la table publique
 */
export async function deleteUserProfile(userId: string) {
    const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

    if (error) {
        console.error("Erreur lors de la suppression du profil :", error.message);
        throw new Error(error.message);
    }
}

const userService = {
    getUserProfile,
    updateUserProfile,
    deleteUserProfile,
};

export default userService;