import { supabase } from '@/lib/supabaseClient';
import { endDemo } from '@/services/demoStore';
import { invalidateCache } from '@/utils/memoryCache';
import { getCategories, getCategoriesGroupKey } from '@/services/transactionCategoryService';
import { buildDataExport, type DataExport } from '@/utils/dataExport';

const PAGE_SIZE = 1000;

/** Vide les données gardées sur l'appareil (cache du budget) : à appeler à la déconnexion et à la suppression. */
export function clearLocalPersonalData(): void {
  invalidateCache();
  endDemo();
  try {
    window.localStorage.removeItem('bilanAnnualData');
  } catch {
    // Stockage indisponible : rien à effacer.
  }
}

async function readAll<T>(table: string, columns: string): Promise<T[]> {
  const rows: T[] = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase.from(table).select(columns).range(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(`Lecture de « ${table} » impossible : ${error.message}`);
    rows.push(...((data ?? []) as unknown as T[]));
    if (!data || data.length < PAGE_SIZE) break;
  }

  return rows;
}

/** Droit d'accès et de portabilité : toutes les données de l'utilisateur connecté, dans un objet lisible. */
export async function exportMyData(): Promise<DataExport> {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) throw new Error('Vous devez être connecté pour exporter vos données.');
  const userId = authData.user.id;

  const [profileResult, settingsResult, transactions, budgetEntries, labelRules, categories, categoryGroups, archivedActuals] =
    await Promise.all([
      supabase.from('users').select('email, pseudo, created_at').eq('id', userId).maybeSingle(),
      supabase.from('user_settings').select('notify_reconcile, notify_budget_overrun').maybeSingle(),
      readAll<{ booked_on: string; label: string; amount: number; category_id: string | null; type: string; reconciled_at: string | null }>(
        'transactions',
        'booked_on, label, amount, category_id, type, reconciled_at',
      ),
      readAll<{ category_id: string; month_index: number; year: number; amount: number }>(
        'budget_entries',
        'category_id, month_index, year, amount',
      ),
      supabase.from('libelle_transacts').select('label, key, id_cat').eq('user_id', userId),
      getCategories(),
      getCategoriesGroupKey(),
      readAll<{ year: number; month_index: number; category_id: string; amount: number; operations_count: number }>(
        'monthly_actuals',
        'year, month_index, category_id, amount, operations_count',
      ),
    ]);

  if (profileResult.error) throw new Error(`Lecture du profil impossible : ${profileResult.error.message}`);
  if (settingsResult.error) throw new Error(`Lecture des préférences impossible : ${settingsResult.error.message}`);
  if (labelRules.error) throw new Error(`Lecture des règles impossible : ${labelRules.error.message}`);

  return buildDataExport({
    exportedAt: new Date(),
    profile: profileResult.data ?? { email: authData.user.email ?? '', pseudo: null },
    settings: settingsResult.data,
    transactions,
    budgetEntries,
    labelRules: labelRules.data ?? [],
    categories,
    categoryGroups,
    archivedActuals,
  });
}

/**
 * Droit à l'effacement : supprime définitivement le compte de l'utilisateur connecté et toutes ses données
 * (fonction SQL public.delete_my_account, voir supabase/migrations/20261008180000_delete_my_account.sql).
 */
export async function deleteMyAccount(): Promise<void> {
  const { error } = await supabase.rpc('delete_my_account');

  if (error) {
    // PGRST202 : la fonction n'existe pas (migration non appliquée).
    if (error.code === 'PGRST202') {
      throw new Error('La suppression de compte n’est pas encore activée sur ce serveur. Contacte l’administrateur.');
    }
    throw new Error(`Suppression impossible : ${error.message}`);
  }

  clearLocalPersonalData();
  await supabase.auth.signOut().catch(() => {});
}
