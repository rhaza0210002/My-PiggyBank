// src/services/transactCatGroupKeyService.ts
import { supabase } from "@/lib/supabaseClient";

export interface TransactCatGroupKey {
  id: number;
  created_at: string;
  label: string;
  key: string;
}

export interface TransactCatGroupKeyInsert {
  label: string;
  key: string;
}

export interface TransactCatGroupKeyUpdate {
  label?: string;
  key?: string;
}

/**
 * Récupère l'ensemble des groupes de transactions depuis la table transact_cat_groupKey.
 */
export async function getTransactCatGroupKeys(): Promise<
  TransactCatGroupKey[]
> {
  const { data, error } = await supabase
    .from("transac_cat_group")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    console.error(
      "Erreur lors de la récupération des groupes de transactions :",
      error.message,
    );
    throw new Error(error.message);
  }

  return data || [];
}

/**
 * Récupère un groupe de transactions par son ID.
 */
export async function getTransactCatGroupKeyById(
  id: number,
): Promise<TransactCatGroupKey | null> {
  const { data, error } = await supabase
    .from("transact_cat_groupKey")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error(
      `Erreur lors de la récupération du groupe ID ${id} :`,
      error.message,
    );
    return null;
  }

  return data;
}

/**
 * Crée un nouveau groupe de transactions dans la table transact_cat_groupKey.
 */
export async function createTransactCatGroupKey(
  payload: TransactCatGroupKeyInsert,
): Promise<TransactCatGroupKey> {
  const { data, error } = await supabase
    .from("transact_cat_groupKey")
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error(
      "Erreur lors de la création du groupe de transactions :",
      error.message,
    );
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Impossible de créer le groupe de transactions.");
  }

  return data;
}

/**
 * Met à jour un groupe de transactions existant.
 */
export async function updateTransactCatGroupKey(
  id: number,
  payload: TransactCatGroupKeyUpdate,
): Promise<TransactCatGroupKey> {
  const { data, error } = await supabase
    .from("transact_cat_groupKey")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error(
      `Erreur lors de la mise à jour du groupe ID ${id} :`,
      error.message,
    );
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Impossible de mettre à jour le groupe de transactions.");
  }

  return data;
}

/**
 * Supprime un groupe de transactions par son ID.
 */
export async function deleteTransactCatGroupKey(id: number): Promise<boolean> {
  const { error } = await supabase
    .from("transact_cat_groupKey")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(
      `Erreur lors de la suppression du groupe ID ${id} :`,
      error.message,
    );
    throw new Error(error.message);
  }

  return true;
}

const transactCatGroupKeyService = {
  getTransactCatGroupKeys,
  getTransactCatGroupKeyById,
  createTransactCatGroupKey,
  updateTransactCatGroupKey,
  deleteTransactCatGroupKey,
};

export default transactCatGroupKeyService;
