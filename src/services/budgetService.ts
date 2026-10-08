// src/services/budgetService.ts
import { supabase } from '@/lib/supabaseClient';
import { requireUserId } from '@/lib/currentUser';

export interface BudgetEntry {
  category_id: string;
  month_index: number;
  amount: number;
}

export async function getBudgetEntries(year: number): Promise<BudgetEntry[]> {
  const userId = await requireUserId("Vous devez être connecté pour consulter le budget.");

  const { data, error } = await supabase
    .from('budget_entries')
    .select('category_id, month_index, amount')
    .eq('user_id', userId)
    .eq('year', year);

  if (error) {
    console.error("Erreur lors de la récupération du budget :", error.message);
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function saveBudgetEntry(
  categoryId: string,
  monthIndex: number,
  amount: number,
  year: number
): Promise<void> {
  const userId = await requireUserId("Vous devez être connecté pour enregistrer le budget.");

  // 1. Vérifier si l'entrée existe déjà et si elle est verrouillée
  const { data: existing, error: fetchError } = await supabase
    .from('budget_entries')
    .select('is_locked')
    .eq('user_id', userId)
    .eq('category_id', categoryId)
    .eq('month_index', monthIndex)
    .eq('year', year)
    .maybeSingle();

  if (fetchError) {
    console.error("Erreur lors de la vérification du verrouillage :", fetchError.message);
  }

  if (existing?.is_locked) {
    throw new Error("Ce mois est clôturé et ne peut plus être modifié.");
  }

  // 2. Procéder à l'upsert si non verrouillé
  const { error } = await supabase
    .from('budget_entries')
    .upsert(
      {
        user_id: userId,
        category_id: categoryId,
        month_index: monthIndex,
        year: year,
        amount: amount,
      },
      { onConflict: 'user_id, category_id, month_index, year' }
    );

  if (error) {
    console.error("Erreur lors de l'enregistrement du budget :", error.message);
    throw new Error(error.message);
  }
}

const budgetService = {
  getBudgetEntries,
  saveBudgetEntry,
};

export default budgetService;