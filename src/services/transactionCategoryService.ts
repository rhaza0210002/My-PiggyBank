// src/services/transactionCategoryService.ts
import { supabase } from '@/lib/supabaseClient';
import { cachedLoad, invalidateCache } from '@/utils/memoryCache';
import { categoryLabelError, normalizeCategoryLabel } from '@/utils/categoryLabel';

/** Groupes et catégories changent très rarement : on les garde 5 minutes (et on les oublie à chaque création). */
const REFERENCE_TTL_MS = 5 * 60 * 1000;

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
  /** NULL : catégorie commune ; sinon catégorie personnelle de l'utilisateur. */
  user_id?: string | null;
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
export function getCategoriesGroupKey(): Promise<CategoryGroup[]> {
  return cachedLoad('categories:groups', REFERENCE_TTL_MS, loadCategoryGroups);
}

async function loadCategoryGroups(): Promise<CategoryGroup[]> {
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
export function getCategories(): Promise<Category[]> {
  return cachedLoad('categories:list', REFERENCE_TTL_MS, loadCategories);
}

async function loadCategories(): Promise<Category[]> {
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

/**
 * Crée une catégorie personnelle (visible dans ce compte seulement), ou commune si l'administrateur le demande. Le nom est vérifié ici puis par la base,
 * qui limite aussi le nombre de catégories par compte (voir categoryLabel.ts).
 */
export async function createCategory(
  label: string,
  categoryGroupId: number,
  { shared = false }: { shared?: boolean } = {},
): Promise<Category> {
  if (!categoryGroupId) {
    throw new Error('Choisis un groupe pour la catégorie.');
  }
  const invalid = categoryLabelError(label);
  if (invalid) throw new Error(invalid);

  const { data, error } = await supabase
    .from('transac_cat')
    // Commune (administrateur seulement, la base le vérifie) ou personnelle (propriétaire posé par la base).
    .insert({ label: normalizeCategoryLabel(label), cat_group_key: categoryGroupId, ...(shared ? { user_id: null } : {}) })
    .select('*')
    .single();

  if (error) {
    console.error('Création de catégorie refusée :', error.code);
    throw new Error(translateCategoryError(error.code, error.message));
  }

  invalidateCache('categories:');
  return data;
}

/** Messages de la base en français ; les règles de nom et la limite arrivent déjà rédigées. */
export function translateCategoryError(code: string | undefined, message: string): string {
  if (code === '23505') return 'Cette catégorie existe déjà dans ce groupe.';
  if (code === '22023' || code === '54000') return message;
  if (code === '42501') return 'Tu ne peux pas modifier cette catégorie.';
  return 'Impossible de créer la catégorie pour le moment.';
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

const transactionCategoryService = {
  getCategoriesGroupKey,
  getCategories,
  createCategory,
  getLibelleTransacts,
};

export default transactionCategoryService;