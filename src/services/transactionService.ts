import { supabase } from '@/lib/supabaseClient';
import { requireUserId } from '@/lib/currentUser';
import type { BankTransaction } from '@/services/csvParser';
import type { TransactionRow } from '@/types/database';
import { getArchivedMonthActuals, getArchivedMonths } from '@/services/archiveService';
import { archivedActivityRows, archivedToTransactions } from '@/utils/archive';
import { fingerprint, sanitizeBankLabel } from '@/utils/bankPrivacy';
import { prepareTransactionsForStorage } from '@/utils/transactionDedupe';

export type StoredTransaction = Pick<
  TransactionRow,
  'id' | 'booked_on' | 'label' | 'amount' | 'category_id' | 'category_key' | 'type' | 'reconciled_at'
>;

export interface SaveTransactionsResult {
  inserted: number;
  duplicates: number;
  invalid: number;
  /** Opérations d'un mois déjà archivé : ignorées, le détail de ce mois n'est plus conservé. */
  archived: number;
}

const COLUMNS = 'id, booked_on, label, amount, category_id, category_key, type, reconciled_at';
const BATCH_SIZE = 500;

function toServiceError(error: { code?: string; message: string }, action: string): Error {
  // PGRST205 : la table n'existe pas dans le schéma exposé par l'API.
  if (error.code === 'PGRST205') {
    return new Error(
      "La table transactions est introuvable. Exécute supabase/migrations/20261008130000_create_transactions.sql dans Supabase.",
    );
  }
  return new Error(`${action} : ${error.message}`);
}


/**
 * Enregistre les transactions importées. Les opérations déjà présentes (même clé de
 * déduplication) sont ignorées, ce qui rend l'import rejouable.
 */
export async function saveImportedTransactions(
  transactions: BankTransaction[],
): Promise<SaveTransactionsResult> {
  const userId = await requireUserId('Vous devez être connecté pour enregistrer les transactions.');
  const { rows: allRows, invalid } = prepareTransactionsForStorage(transactions);
  const archivedKeys = new Set(
    (await getArchivedMonths()).map((month) => `${month.year}-${String(month.month_index + 1).padStart(2, '0')}`),
  );
  const plainRows = allRows.filter((row) => !archivedKeys.has(row.booked_on.slice(0, 7)));
  const archived = allRows.length - plainRows.length;
  // Minimisation : libellé masqué (carte, IBAN, e-mail) et clé anti-doublon réduite à une empreinte.
  const rows = await Promise.all(
    plainRows.map(async (row) => ({
      ...row,
      label: sanitizeBankLabel(row.label),
      dedupe_key: await fingerprint(row.dedupe_key),
    })),
  );

  let inserted = 0;

  for (let start = 0; start < rows.length; start += BATCH_SIZE) {
    const batch = rows.slice(start, start + BATCH_SIZE).map((row) => ({ ...row, user_id: userId }));

    const { data, error } = await supabase
      .from('transactions')
      .upsert(batch, { onConflict: 'user_id,dedupe_key', ignoreDuplicates: true })
      .select('id');

    if (error) throw toServiceError(error, "Enregistrement des transactions impossible");
    inserted += data?.length ?? 0;
  }

  return { inserted, duplicates: rows.length - inserted, invalid: invalid.length, archived };
}

export async function getRecentTransactions(limit: number): Promise<StoredTransaction[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select(COLUMNS)
    .order('booked_on', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw toServiceError(error, 'Lecture des transactions impossible');
  return data ?? [];
}

/** Opérations pas encore pointées par l'utilisateur (rapprochement), de la plus récente à la plus ancienne. */
export async function getTransactionsToReconcile(limit: number): Promise<StoredTransaction[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select(COLUMNS)
    .is('reconciled_at', null)
    .order('booked_on', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw toServiceError(error, 'Lecture des opérations à rapprocher impossible');
  return data ?? [];
}

export async function countTransactionsToReconcile(): Promise<number> {
  const { count, error } = await supabase
    .from('transactions')
    .select('id', { count: 'exact', head: true })
    .is('reconciled_at', null);

  if (error) throw toServiceError(error, 'Comptage des opérations à rapprocher impossible');
  return count ?? 0;
}

/** Rattache une opération à une catégorie (donc à la ligne de budget de cette catégorie et de son mois). */
export async function updateTransactionCategory(id: string, categoryId: string | null): Promise<void> {
  const { error } = await supabase
    .from('transactions')
    .update({ category_id: categoryId, category_key: null })
    .eq('id', id);

  if (error) throw toServiceError(error, 'Changement de catégorie impossible');
}

/** Pointe des opérations : elles ne sont plus à rapprocher. */
export async function markTransactionsReconciled(ids: string[]): Promise<void> {
  if (ids.length === 0) return;

  const { error } = await supabase
    .from('transactions')
    .update({ reconciled_at: new Date().toISOString() })
    .in('id', ids);

  if (error) throw toServiceError(error, 'Pointage des opérations impossible');
}

/** Annule un pointage fait par erreur : les opérations reviennent dans celles à rapprocher. */
export async function unreconcileTransactions(ids: string[]): Promise<void> {
  if (ids.length === 0) return;

  const { error } = await supabase
    .from('transactions')
    .update({ reconciled_at: null })
    .in('id', ids);

  if (error) throw toServiceError(error, 'Annulation du pointage impossible');
}

/** Opérations sans catégorie : celles qu'il reste à traiter. */
export async function getUncategorizedTransactions(limit: number): Promise<StoredTransaction[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select(COLUMNS)
    .is('category_id', null)
    .order('booked_on', { ascending: false })
    .limit(limit);

  if (error) throw toServiceError(error, 'Lecture des opérations à rapprocher impossible');
  return data ?? [];
}

export async function countUncategorizedTransactions(): Promise<number> {
  const { count, error } = await supabase
    .from('transactions')
    .select('id', { count: 'exact', head: true })
    .is('category_id', null);

  if (error) throw toServiceError(error, 'Comptage des opérations impossible');
  return count ?? 0;
}

export interface MonthTotals {
  income: number;
  expenses: number;
  net: number;
  count: number;
}

/** Bornes [début, début du mois suivant[ d'un mois (monthIndex : 0 = janvier). */
function getMonthRange(year: number, monthIndex: number): { start: string; next: string } {
  const pad = (value: number) => String(value).padStart(2, '0');
  return {
    start: `${year}-${pad(monthIndex + 1)}-01`,
    next: monthIndex === 11 ? `${year + 1}-01-01` : `${year}-${pad(monthIndex + 2)}-01`,
  };
}

/** Toutes les transactions d'un mois, de la plus récente à la plus ancienne. */
export async function getTransactionsForMonth(
  year: number,
  monthIndex: number,
): Promise<StoredTransaction[]> {
  const { start, next } = getMonthRange(year, monthIndex);

  const { data, error } = await supabase
    .from('transactions')
    .select(COLUMNS)
    .gte('booked_on', start)
    .lt('booked_on', next)
    .order('booked_on', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw toServiceError(error, 'Lecture des transactions du mois impossible');
  if (data && data.length > 0) return data;

  // Mois archivé : plus de lignes bancaires, seulement un total par catégorie.
  const archived = await getArchivedMonthActuals(year, monthIndex);
  return archived ? archivedToTransactions(archived.actuals, year, monthIndex, archived.completedAt) : [];
}

/** Revenus, dépenses et solde net d'un mois (monthIndex : 0 = janvier). */
export async function getMonthTotals(year: number, monthIndex: number): Promise<MonthTotals> {
  const { start, next } = getMonthRange(year, monthIndex);

  const { data, error } = await supabase
    .from('transactions')
    .select('amount')
    .gte('booked_on', start)
    .lt('booked_on', next);

  if (error) throw toServiceError(error, 'Calcul du solde du mois impossible');
  if (data && data.length > 0) return summarizeAmounts(data.map((row) => Number(row.amount)));

  const archived = await getArchivedMonthActuals(year, monthIndex);
  return summarizeAmounts((archived?.actuals ?? []).map((actual) => Number(actual.amount)));
}

export function summarizeAmounts(amounts: number[]): MonthTotals {
  const totals = amounts.reduce(
    (sum, amount) => {
      if (amount >= 0) sum.income += amount;
      else sum.expenses += amount;
      return sum;
    },
    { income: 0, expenses: 0 },
  );

  return {
    income: totals.income,
    expenses: totals.expenses,
    net: totals.income + totals.expenses,
    count: amounts.length,
  };
}

const ACTIVITY_PAGE_SIZE = 1000;

/** Date et état de pointage de toutes les opérations de l'utilisateur (alimente les récompenses). */
export async function getReconciliationActivity(): Promise<Array<Pick<StoredTransaction, 'booked_on' | 'reconciled_at'>>> {
  const rows: Array<Pick<StoredTransaction, 'booked_on' | 'reconciled_at'>> = [];

  for (let from = 0; ; from += ACTIVITY_PAGE_SIZE) {
    const { data, error } = await supabase
      .from('transactions')
      .select('booked_on, reconciled_at')
      .order('booked_on', { ascending: true })
      .range(from, from + ACTIVITY_PAGE_SIZE - 1);

    if (error) throw toServiceError(error, 'Lecture de la progression impossible');
    rows.push(...(data ?? []));
    if (!data || data.length < ACTIVITY_PAGE_SIZE) break;
  }

  // Les mois archivés comptent toujours pour les points et les mois bouclés.
  rows.push(...archivedActivityRows(await getArchivedMonths()));
  return rows;
}
