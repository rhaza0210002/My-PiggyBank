import { supabase } from '@/lib/supabaseClient';

export interface UserProfile {
    id: string;
    email: string;
    pseudo?: string | null;
    created_at?: string;
    updated_at?: string;
}

/**
 * Récupère le profil de l'utilisateur connecté
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) {
        console.error("Erreur lors de la récupération du profil :", error.message);
        throw new Error(error.message);
    }

    return data;
}

/**
 * Met à jour le profil de l'utilisateur connecté
 */
export async function updateUserProfile(userId: string, updates: Partial<UserProfile>) {
    const { data, error } = await supabase
        .from('users')
        .update({
            ...updates,
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