// src/services/transactionCategoryService.ts
import { supabase } from '@/lib/supabaseClient';

export interface CategoryGroup {
  id: number;
  label: string;
  libelle: string;
  created_at?: string;
}

export interface Category {
  id: string;
  label: string;
  cat_group_key: number;
  created_at?: string;
}

export interface LibelleTransact {
  id: string;
  label: string;
  key: string;
  id_cat: string;
}

/**
 * Récupère l'ensemble des groupes de catégories depuis Supabase.
 */
export async function getCategoriesGroupKey(): Promise<CategoryGroup[]> {
  const { data, error } = await supabase
    .from('transac_cat_group')
    .select('*')
    .order('libelle', { ascending: true });

  if (error) {
    console.error("Erreur lors de la récupération des groupes :", error.message);
    throw new Error(error.message);
  }

  return data || [];
}

/**
 * Récupère l'ensemble des catégories de transactions depuis Supabase.
 */
export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('transac_cat')
    .select('*')
    .order('label', { ascending: true });

  if (error) {
    console.error("Erreur lors de la récupération des catégories :", error.message);
    throw new Error(error.message);
  }

  return data || [];
}

export async function createCategory(
  label: string, 
  categoryGroupId: number
): Promise<Category> {
  if (!categoryGroupId) {
    throw new Error("L'ID du groupe de catégorie est vide ou manquant !");
  }

  const { data, error } = await supabase
    .from('transac_cat')
    .insert({ 
      label: label.trim(), 
      cat_group_key: categoryGroupId
    })
    .select('*')
    .single();

  if (error) {
    console.error("Erreur Supabase détaillée :", error);
    throw new Error(error.message);
  }

  return data;
}
/**
 * Récupère l'ensemble des libellés de transactions.
 */
export async function getLibelleTransacts(): Promise<LibelleTransact[]> {
  const { data, error } = await supabase
    .from('libelle_transacts')
    .select('*');

  if (error) {
    console.error("Erreur lors de la récupération des libellés :", error.message);
    throw new Error(error.message);
  }

  return data || [];
}

/**
 * Trouve la catégorie associée à un libellé donné (recherche insensible à la casse).
 */
export async function findCategoryByLibelle(libelle: string): Promise<Category | null> {
  const sanitizedLibelle = libelle.toLowerCase().trim();

  const { data: transacts, error: transError } = await supabase
    .from('libelle_transacts')
    .select('id_cat, label')
    .ilike('label', `%${sanitizedLibelle}%`)
    .limit(1);

  if (transError || !transacts || transacts.length === 0 || !transacts[0].id_cat) {
    return null;
  }

  const categoryId = transacts[0].id_cat;

  const { data: category, error: catError } = await supabase
    .from('transac_cat')
    .select('*')
    .eq('id', categoryId)
    .single();

  if (catError || !category) {
    return null;
  }

  return category;
}

const transactionCategoryService = {
  getCategoriesGroupKey,
  getCategories,
  createCategory,
  getLibelleTransacts,
  findCategoryByLibelle,
};

export default transactionCategoryService;