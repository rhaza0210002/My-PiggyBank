import { supabase } from '@/lib/supabaseClient';
// import { BankTransaction } from '@/services/csvParser';

export interface SavedTransactionRecord {
  user_id: string;
  date: string;
  label: string;
  amount: number;
  category_id: string | null;
  transaction_type: string;
}

/**
 * Sauvegarde un lot de transactions validées dans Supabase
 */
export async function saveTransactionsToDatabase(transactions: BankTransaction[], userId: string) {
  const records: SavedTransactionRecord[] = transactions.map((tx) => ({
    user_id: userId,
    date: tx.date,
    label: tx.label || tx.detail,
    amount: tx.amount,
    category_id: tx.categoryId,
    transaction_type: tx.type,
  }));

  const { data, error } = await supabase
    .from('transactions')
    .insert(records)
    .select();

  if (error) {
    console.error("Erreur lors de l'insertion des transactions :", error.message);
    throw new Error(error.message);
  }

  return data;
}

/**
 * Récupère les transactions enregistrées pour un utilisateur
 */
export async function fetchUserTransactions(userId: string) {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (error) {
    console.error("Erreur lors de la récupération des transactions :", error.message);
    return [];
  }

  return data;
}