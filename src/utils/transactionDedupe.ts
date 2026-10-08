import type { BankTransaction } from '@/services/csvParser';
import { toIsoDate } from '@/utils/csvParsing';

export interface TransactionToStore {
  booked_on: string;
  label: string;
  amount: number;
  category_id: string | null;
  category_key: string | null;
  type: BankTransaction['type'];
  dedupe_key: string;
}

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

/**
 * Prépare les transactions du CSV pour la base. La clé de déduplication repose sur le libellé
 * brut de la banque (et non sur la catégorie) : ajouter une règle de libellé plus tard ne change
 * donc pas la clé. Deux opérations identiques le même jour reçoivent un rang (#1, #2...) pour ne
 * pas être confondues. Les lignes sans date valide sont retournées dans `invalid`.
 */
export function prepareTransactionsForStorage(transactions: BankTransaction[]): {
  rows: TransactionToStore[];
  invalid: BankTransaction[];
} {
  const occurrences = new Map<string, number>();
  const rows: TransactionToStore[] = [];
  const invalid: BankTransaction[] = [];

  transactions.forEach((transaction) => {
    const bookedOn = toIsoDate(transaction.date);
    if (!bookedOn) {
      invalid.push(transaction);
      return;
    }

    const baseKey = `${bookedOn}|${transaction.amount.toFixed(2)}|${normalizeText(transaction.rawDetail)}`;
    const rank = (occurrences.get(baseKey) ?? 0) + 1;
    occurrences.set(baseKey, rank);

    rows.push({
      booked_on: bookedOn,
      label: transaction.rawDetail.trim(),
      amount: transaction.amount,
      category_id: transaction.categoryId,
      category_key: transaction.categoryKey,
      type: transaction.type,
      dedupe_key: `${baseKey}|${rank}`,
    });
  });

  return { rows, invalid };
}
