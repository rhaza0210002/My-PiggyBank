import type { BankTransaction } from '@/services/csvParser';

export interface CategoryTransactionGroup {
  categoryLabel: string;
  categoryId: string | null;
  totalAmount: number;
  records: BankTransaction[];
}

export function groupTransactionsByCategory(
  transactions: BankTransaction[],
): CategoryTransactionGroup[] {
  const groups = transactions.reduce<Record<string, CategoryTransactionGroup>>(
    (result, transaction) => {
      const categoryLabel = transaction.categoryKey ?? 'Non catégorisé';
      const group = result[categoryLabel] ?? {
        categoryLabel,
        categoryId: transaction.categoryId,
        totalAmount: 0,
        records: [],
      };

      group.totalAmount += transaction.amount;
      group.records.push(transaction);
      result[categoryLabel] = group;
      return result;
    },
    {},
  );

  return Object.values(groups);
}