import type { ActivityRow } from '@/utils/gamification';

export interface ArchivedMonth {
  year: number;
  month_index: number;
  operations_count: number;
  completed_at: string;
}

export interface MonthlyActual {
  category_id: string;
  amount: number | string;
  operations_count: number;
}

export interface ArchivableTransaction {
  category_id: string | null;
  reconciled_at: string | null;
}

const pad = (value: number) => String(value).padStart(2, '0');

export function monthStart(year: number, monthIndex: number): string {
  return `${year}-${pad(monthIndex + 1)}-01`;
}

/**
 * Un mois ne s'archive que s'il est entièrement pointé et catégorisé : sinon on perdrait le détail
 * de ce qu'il reste à faire. Renvoie la raison du blocage, ou null quand c'est possible.
 */
export function getArchiveBlocker(transactions: readonly ArchivableTransaction[]): string | null {
  if (transactions.length === 0) return 'Aucune opération à archiver ce mois-ci.';
  if (transactions.some((transaction) => !transaction.reconciled_at)) {
    return 'Pointe d’abord toutes les opérations du mois.';
  }
  if (transactions.some((transaction) => !transaction.category_id)) {
    return 'Catégorise d’abord toutes les opérations du mois.';
  }
  return null;
}

/**
 * Un mois archivé n'a plus de lignes bancaires : on le présente comme une « opération » par catégorie
 * (le total), pour que le bilan et les graphiques fonctionnent sans rien changer.
 */
export function archivedToTransactions(
  actuals: readonly MonthlyActual[],
  year: number,
  monthIndex: number,
  completedAt: string,
) {
  return actuals.map((actual) => {
    const amount = Number(actual.amount);
    return {
      id: `archive-${year}-${monthIndex}-${actual.category_id}`,
      booked_on: monthStart(year, monthIndex),
      label: `Total archivé (${actual.operations_count} opération${actual.operations_count > 1 ? 's' : ''})`,
      amount,
      category_id: actual.category_id,
      category_key: null,
      type: (amount >= 0 ? 'VIREMENT_ENTRANT' : 'AUTRE') as 'VIREMENT_ENTRANT' | 'AUTRE',
      reconciled_at: completedAt,
    };
  });
}

/** Les mois archivés comptent toujours pour les points : autant de lignes pointées que d'opérations. */
export function archivedActivityRows(months: readonly ArchivedMonth[]): ActivityRow[] {
  return months.flatMap((month) =>
    Array.from({ length: month.operations_count }, () => ({
      booked_on: monthStart(month.year, month.month_index),
      reconciled_at: month.completed_at,
    })),
  );
}

const ARCHIVE_ID_PREFIX = 'archive-';

/** Vrai quand la liste du mois ne contient que des totaux archivés (aucune ligne bancaire). */
export function isArchivedList(transactions: readonly { id: string }[]): boolean {
  return transactions.length > 0 && transactions.every((transaction) => transaction.id.startsWith(ARCHIVE_ID_PREFIX));
}
