import { supabase } from '@/lib/supabaseClient';
import type { BankTransaction } from '@/services/csvParser';
import type { TransactionRow } from '@/types/database';
import { prepareTransactionsForStorage } from '@/utils/transactionDedupe';

export type StoredTransaction = Pick<
  TransactionRow,
  'id' | 'booked_on' | 'label' | 'amount' | 'category_id' | 'category_key' | 'type'
>;

export interface SaveTransactionsResult {
  inserted: number;
  duplicates: number;
  invalid: number;
}

const COLUMNS = 'id, booked_on, label, amount, category_id, category_key, type';
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

async function requireUserId(message: string): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error(message);
  return data.user.id;
}

/**
 * Enregistre les transactions importées. Les opérations déjà présentes (même clé de
 * déduplication) sont ignorées, ce qui rend l'import rejouable.
 */
export async function saveImportedTransactions(
  transactions: BankTransaction[],
): Promise<SaveTransactionsResult> {
  const userId = await requireUserId('Vous devez être connecté pour enregistrer les transactions.');
  const { rows, invalid } = prepareTransactionsForStorage(transactions);

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

  return { inserted, duplicates: rows.length - inserted, invalid: invalid.length };
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

/** Revenus, dépenses et solde net d'un mois (monthIndex : 0 = janvier). */
export async function getMonthTotals(year: number, monthIndex: number): Promise<MonthTotals> {
  const pad = (value: number) => String(value).padStart(2, '0');
  const start = `${year}-${pad(monthIndex + 1)}-01`;
  const next = monthIndex === 11 ? `${year + 1}-01-01` : `${year}-${pad(monthIndex + 2)}-01`;

  const { data, error } = await supabase
    .from('transactions')
    .select('amount')
    .gte('booked_on', start)
    .lt('booked_on', next);

  if (error) throw toServiceError(error, 'Calcul du solde du mois impossible');

  const totals = (data ?? []).reduce(
    (sum, row) => {
      const amount = Number(row.amount);
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
    count: data?.length ?? 0,
  };
}
