import { LIBELLETRANSACT_CATEGORIES } from '@/constants/transactionLabel';
import type { BankTransaction } from '@/services/csvParser';

export interface CategoryTransactionGroup {
  categoryLabel: string;
  categoryId: string | null;
  totalAmount: number;
  records: BankTransaction[];
}

function getCategoryLabel(categoryId: string | null): string {
  if (!categoryId) return 'Non catégorisé';

  const category = LIBELLETRANSACT_CATEGORIES.find((item) => item.key === categoryId);
  return category?.label ?? 'Autre';
}

export function groupTransactionsByCategory(
  transactions: BankTransaction[],
): CategoryTransactionGroup[] {
  const groups = transactions.reduce<Record<string, CategoryTransactionGroup>>(
    (result, transaction) => {
      const categoryLabel = getCategoryLabel(transaction.categoryId);
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