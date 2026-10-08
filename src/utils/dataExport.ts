import type { Category, CategoryGroup } from '@/services/transactionCategoryService';

export interface ExportInput {
  exportedAt: Date;
  profile: { email: string; pseudo: string | null; created_at?: string } | null;
  transactions: Array<{
    booked_on: string;
    label: string;
    amount: number | string;
    category_id: string | null;
    type: string;
    reconciled_at: string | null;
  }>;
  budgetEntries: Array<{ category_id: string; month_index: number; year: number; amount: number | string }>;
  labelRules: Array<{ label: string; key: string; id_cat: string | null }>;
  settings: { notify_reconcile: boolean; notify_budget_overrun: boolean } | null;
  categories: Category[];
  categoryGroups: CategoryGroup[];
  /** Totaux réels des mois archivés (le détail des opérations de ces mois n'existe plus). */
  archivedActuals?: Array<{ year: number; month_index: number; category_id: string; amount: number | string; operations_count: number }>;
}

export interface DataExport {
  exportedAt: string;
  description: string;
  profile: ExportInput['profile'];
  settings: ExportInput['settings'];
  transactions: Array<{ date: string; libelle: string; montant: number; categorie: string | null; type: string; pointee_le: string | null }>;
  budget: Array<{ annee: number; mois: number; groupe: string | null; categorie: string; montant: number }>;
  reglesDeLibelle: Array<{ motCle: string; categorie: string | null }>;
  totauxArchives: Array<{ annee: number; mois: number; categorie: string; montant: number; operations: number }>;
}

/**
 * Rassemble toutes les données personnelles dans un fichier lisible : les identifiants techniques sont remplacés
 * par les noms de catégories et de groupes (droit d'accès et de portabilité, RGPD art. 15 et 20).
 */
export function buildDataExport(input: ExportInput): DataExport {
  const categoryById = new Map(input.categories.map((category) => [category.id, category]));
  const groupById = new Map(input.categoryGroups.map((group) => [group.id, group]));
  const categoryName = (id: string | null) => (id ? (categoryById.get(id)?.label ?? null) : null);

  return {
    exportedAt: input.exportedAt.toISOString(),
    description: 'Export de mes données My PiggyBank. Les montants négatifs sont des dépenses ; les mois vont de 1 (janvier) à 12.',
    profile: input.profile,
    settings: input.settings,
    transactions: input.transactions.map((transaction) => ({
      date: transaction.booked_on,
      libelle: transaction.label,
      montant: Number(transaction.amount),
      categorie: categoryName(transaction.category_id),
      type: transaction.type,
      pointee_le: transaction.reconciled_at,
    })),
    budget: input.budgetEntries.map((entry) => {
      const category = categoryById.get(entry.category_id);
      return {
        annee: entry.year,
        mois: entry.month_index + 1,
        groupe: category ? (groupById.get(category.cat_group_key)?.libelle ?? null) : null,
        categorie: category?.label ?? 'Catégorie supprimée',
        montant: Number(entry.amount),
      };
    }),
    totauxArchives: (input.archivedActuals ?? []).map((actual) => ({
      annee: actual.year,
      mois: actual.month_index + 1,
      categorie: categoryName(actual.category_id) ?? 'Catégorie supprimée',
      montant: Number(actual.amount),
      operations: actual.operations_count,
    })),
    reglesDeLibelle: input.labelRules.map((rule) => ({ motCle: rule.label, categorie: categoryName(rule.id_cat) ?? rule.key })),
  };
}

export function exportFileName(date: Date): string {
  return `my-piggybank-mes-donnees-${date.toISOString().slice(0, 10)}.json`;
}
