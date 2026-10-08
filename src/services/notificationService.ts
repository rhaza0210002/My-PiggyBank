import { getBudgetEntries } from '@/services/budgetService';
import { getCategories } from '@/services/transactionCategoryService';
import { countTransactionsToReconcile, getTransactionsForMonth } from '@/services/transactionService';
import type { UserSettings } from '@/services/userSettingsService';
import { formatCurrency } from '@/utils/budgetCalculations';
import { MONTHS } from '@/constants/tableStyles';

export interface AppNotification {
  id: string;
  level: 'warning' | 'info';
  title: string;
  detail: string;
  href?: string;
}

/** Calcule les notifications à partir des données du mois en cours, selon les préférences. */
export async function getNotifications(settings: UserSettings, now = new Date()): Promise<AppNotification[]> {
  const year = now.getFullYear();
  const monthIndex = now.getMonth();
  const monthLabel = MONTHS[monthIndex].label.toLowerCase();
  const notifications: AppNotification[] = [];

  const [toReconcile, transactions, budgetEntries, categories] = await Promise.all([
    settings.notify_reconcile ? countTransactionsToReconcile() : Promise.resolve(0),
    getTransactionsForMonth(year, monthIndex),
    settings.notify_budget_overrun ? getBudgetEntries(year) : Promise.resolve([]),
    settings.notify_budget_overrun ? getCategories() : Promise.resolve([]),
  ]);

  if (toReconcile > 0) {
    notifications.push({
      id: 'reconcile',
      level: 'warning',
      title: `${toReconcile} opération${toReconcile > 1 ? 's' : ''} à rapprocher`,
      detail: 'Vérifie leur catégorie puis pointe-les.',
      href: '/rapprochement',
    });
  }

  if (settings.notify_budget_overrun) {
    const budgetByCategory = new Map<string, number>();
    budgetEntries
      .filter((entry) => entry.month_index === monthIndex)
      .forEach((entry) => {
        budgetByCategory.set(entry.category_id, (budgetByCategory.get(entry.category_id) ?? 0) + Number(entry.amount));
      });

    const spentByCategory = new Map<string, number>();
    transactions.forEach((transaction) => {
      const amount = Number(transaction.amount);
      if (!transaction.category_id || amount >= 0) return;
      spentByCategory.set(transaction.category_id, (spentByCategory.get(transaction.category_id) ?? 0) - amount);
    });

    categories.forEach((category) => {
      const budget = budgetByCategory.get(category.id) ?? 0;
      const spent = spentByCategory.get(category.id) ?? 0;
      if (budget > 0 && spent > budget) {
        notifications.push({
          id: `overrun-${category.id}`,
          level: 'warning',
          title: `Budget dépassé : ${category.label}`,
          detail: `${formatCurrency(spent)} dépensés pour ${formatCurrency(budget)} prévus en ${monthLabel}.`,
          href: '/depense-reelle',
        });
      }
    });
  }

  if (transactions.length === 0) {
    notifications.push({
      id: 'no-import',
      level: 'info',
      title: `Aucune opération en ${monthLabel}`,
      detail: 'Importe ton relevé CSV pour suivre tes dépenses réelles.',
      href: '/csvUploader',
    });
  }

  return notifications;
}
