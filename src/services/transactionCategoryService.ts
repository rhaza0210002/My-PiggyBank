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
  /** NULL : règle par défaut partagée ; sinon règle personnelle de l'utilisateur. */
  user_id?: string | null;
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
    if (error.code === '42501') {
      throw new Error("Seul l'administrateur peut créer une catégorie.");
    }
    if (error.code === '23505') {
      throw new Error('Cette catégorie existe déjà dans ce groupe.');
    }
    throw new Error(error.message);
  }

  return data;
}
/**
 * Récupère les règles de libellé visibles : celles par défaut et les personnelles. Les personnelles
 * viennent en premier : le parseur retient la première règle qui correspond, elles l'emportent donc.
 */
export async function getLibelleTransacts(): Promise<LibelleTransact[]> {
  const { data, error } = await supabase
    .from('libelle_transacts')
    .select('*');

  if (error) {
    console.error("Erreur lors de la récupération des libellés :", error.message);
    throw new Error(error.message);
  }

  return [...(data || [])].sort(
    (first, second) => Number(second.user_id != null) - Number(first.user_id != null),
  );
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