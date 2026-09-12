// src/services/transactionCategoryService.ts
import { supabase } from '@/lib/supabaseClient';

export interface Category {
  id: string;
  label: string;
  key: string;
}

export interface LibelleTransact {
  id: number;
  label: string;
  key: string;
  id_cat: string;
}

/**
 * Récupère l'ensemble des catégories de transactions depuis Supabase.
 */
export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('libelle_transact_categories')
    .select('*')
    .order('label', { ascending: true });

  if (error) {
    console.error("Erreur lors de la récupération des catégories :", error.message);
    throw new Error(error.message);
  }

  return data || [];
}

/**
 * Récupère l'ensemble des libellés de transactions associés avec leurs clés.
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

  // Recherche d'une correspondance exacte ou partielle dans les libellés enregistrés
  const { data: transacts, error: transError } = await supabase
    .from('libelle_transacts')
    .select('id_cat, label')
    .ilike('label', `%${sanitizedLibelle}%`)
    .limit(1);

  if (transError || !transacts || transacts.length === 0) {
    return null;
  }

  const categoryId = transacts[0].id_cat;

  const { data: category, error: catError } = await supabase
    .from('libelle_transact_categories')
    .select('*')
    .eq('id', categoryId)
    .single();

  if (catError || !category) {
    return null;
  }

  return category;
}