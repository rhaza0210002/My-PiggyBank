import { supabase } from '@/lib/supabaseClient';
import { invalidateCache } from '@/utils/memoryCache';
import type { ArchivedMonth, MonthlyActual } from '@/utils/archive';

function toServiceError(error: { code?: string; message: string }, action: string): Error {
  // PGRST202 : fonction absente (migration d'archivage non appliquée).
  if (error.code === 'PGRST202') {
    return new Error('L’archivage n’est pas encore activé sur ce serveur. Contacte l’administrateur.');
  }
  return new Error(`${action} : ${error.message}`);
}

/** Tous les mois archivés de l'utilisateur (peu de lignes : au plus un par mois). */
export async function getArchivedMonths(): Promise<ArchivedMonth[]> {
  const { data, error } = await supabase
    .from('archived_months')
    .select('year, month_index, operations_count, completed_at');

  if (error) throw toServiceError(error, 'Lecture des mois archivés impossible');
  return data ?? [];
}

/** Totaux réels par catégorie d'un mois archivé, ou null si le mois n'est pas archivé. */
export async function getArchivedMonthActuals(
  year: number,
  monthIndex: number,
): Promise<{ completedAt: string; actuals: MonthlyActual[] } | null> {
  const { data: month, error: monthError } = await supabase
    .from('archived_months')
    .select('completed_at')
    .eq('year', year)
    .eq('month_index', monthIndex)
    .maybeSingle();

  if (monthError) throw toServiceError(monthError, 'Lecture du mois archivé impossible');
  if (!month) return null;

  const { data, error } = await supabase
    .from('monthly_actuals')
    .select('category_id, amount, operations_count')
    .eq('year', year)
    .eq('month_index', monthIndex);

  if (error) throw toServiceError(error, 'Lecture des totaux archivés impossible');
  return { completedAt: month.completed_at, actuals: data ?? [] };
}

/** Archive un mois pointé : garde les totaux par catégorie et efface le détail des opérations (atomique, côté base). */
export async function archiveMonth(year: number, monthIndex: number): Promise<number> {
  const { data, error } = await supabase.rpc('archive_month', { p_year: year, p_month_index: monthIndex });
  if (error) throw toServiceError(error, 'Archivage impossible');
  invalidateCache();
  return Number(data ?? 0);
}
