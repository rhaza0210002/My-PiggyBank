import type { BankTransaction } from '@/services/csvParser';
import type { StoredTransaction } from '@/services/transactionService';
import type { LibelleTransact } from '@/services/transactionCategoryService';
import { toIsoDate } from '@/utils/csvParsing';
import { normalizeMatchText } from '@/utils/labelMatching';

interface DemoLine {
  dayOffset: number;
  label: string;
  amount: number;
  /** Mot cherché dans les règles de l'utilisateur pour ranger l'opération (facultatif). */
  hint?: string;
}

const DEMO_LINES: DemoLine[] = [
  { dayOffset: 1, label: 'VIREMENT SALAIRE EXEMPLE', amount: 1850, hint: 'salaire' },
  { dayOffset: 2, label: 'LOYER EXEMPLE', amount: -620, hint: 'loyer' },
  { dayOffset: 3, label: 'COURSES SUPERMARCHE EXEMPLE', amount: -64.3, hint: 'courses' },
  { dayOffset: 5, label: 'ABONNEMENT TELEPHONE EXEMPLE', amount: -19.99, hint: 'telephone' },
  { dayOffset: 7, label: 'COURSES SUPERMARCHE EXEMPLE', amount: -41.8, hint: 'courses' },
  { dayOffset: 9, label: 'BOULANGERIE EXEMPLE', amount: -6.4 },
  { dayOffset: 12, label: 'PHARMACIE EXEMPLE', amount: -12.5, hint: 'pharmacie' },
  { dayOffset: 15, label: 'CINEMA EXEMPLE', amount: -23 },
];

function isoDay(base: Date, dayOffset: number): string {
  const date = new Date(Date.UTC(base.getFullYear(), base.getMonth(), dayOffset));
  return date.toISOString().slice(0, 10);
}

/**
 * Relevé d'exemple pour découvrir l'application sans importer de vraies données : ces opérations
 * n'existent que dans le navigateur et ne sont jamais enregistrées. Quand une règle de l'utilisateur
 * correspond à l'indice d'une ligne, celle-ci est rangée dans sa vraie catégorie.
 */
export function buildDemoTransactions(
  rules: readonly LibelleTransact[],
  now: Date = new Date(),
): BankTransaction[] {
  return DEMO_LINES.map((line, index) => {
    const hint = line.hint ? normalizeMatchText(line.hint) : '';
    const rule = hint
      ? rules.find((candidate) => normalizeMatchText(`${candidate.key} ${candidate.label}`).includes(hint))
      : undefined;

    return {
      id: `demo-${index}`,
      date: isoDay(now, line.dayOffset),
      label: rule?.label ?? '',
      detail: line.label.toLowerCase(),
      rawDetail: line.label,
      amount: line.amount,
      categoryId: rule?.id_cat ?? null,
      categoryLabel: rule?.key ?? null,
      categoryKey: rule?.key ?? null,
      type: line.amount >= 0 ? 'VIREMENT_ENTRANT' : 'VIREMENT_SORTANT',
    } satisfies BankTransaction;
  });
}

/** Les opérations d'exemple sous la forme où le service les range (jamais pointées au départ). */
export function toStoredDemo(transactions: BankTransaction[]): StoredTransaction[] {
  return transactions.flatMap((transaction, index) => {
    const bookedOn = toIsoDate(transaction.date);
    if (!bookedOn) return [];
    return [
      {
        id: `demo-${index}`,
        booked_on: bookedOn,
        label: transaction.rawDetail.trim(),
        amount: transaction.amount,
        category_id: transaction.categoryId,
        category_key: transaction.categoryKey,
        type: transaction.type,
        reconciled_at: null,
      },
    ];
  });
}

/** Importer un vrai fichier pendant un exemple actif efface l'exemple : on demande d'abord. */
export const shouldConfirmReplaceDemo = (demoActive: boolean, isDemoPreview: boolean): boolean =>
  demoActive && !isDemoPreview;
