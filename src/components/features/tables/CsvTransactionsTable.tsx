"use client";

import { useMemo, useState } from 'react';
import SectionStack from '@/components/ui/SectionStack';
import { TABLE_STYLES } from '@/constants/tableStyles';
import { saveImportedTransactionLabels } from '@/services/libelleTransactService';
import { saveImportedTransactions } from '@/services/transactionService';
import MonthlyBudgetComparison from '@/components/features/tables/MonthlyBudgetComparison';
import {
  groupTransactionsByCategory,
  type CategoryTransactionGroup,
} from '@/utils/csvTransactionGrouping';
import type { BankTransaction } from '@/services/csvParser';

interface CsvTransactionsTableProps {
  transactions: BankTransaction[];
  /** Relevé d'exemple : on peut tout regarder, mais rien ne peut être enregistré. */
  isDemo?: boolean;
}

const categoryBackgrounds = [
  'bg-surface-douce/80',
  'bg-surface-douce/80',
  'bg-ok-fond/80',
  'bg-depasse-fond/80',
  'bg-attention-fond/80',
  'bg-ok-fond/80',
];

function getCategoryBackground(categoryLabel: string): string {
  const hash = [...categoryLabel].reduce(
    (value, character) => (value * 31 + character.charCodeAt(0)) >>> 0,
    0,
  );
  return categoryBackgrounds[hash % categoryBackgrounds.length];
}

function CategoryRows({
  group,
  isExpanded,
  onToggle,
}: {
  group: CategoryTransactionGroup;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const highlightClass = group.categoryId
    ? getCategoryBackground(group.categoryLabel)
    : 'bg-white/40';

  return (
    <>
      <tr className={`border-b border-bordure/30 transition-colors ${highlightClass}`}>
        <td className={TABLE_STYLES.cellCategory}>
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={isExpanded}
            className="flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1 text-left text-xs font-bold text-texte transition hover:bg-white/40"
          >
            {group.categoryId ? (
              <span className="rounded-full border border-bordure bg-white/75 px-2.5 py-1 shadow-sm">
                {group.categoryLabel}
              </span>
            ) : (
              <span className="italic text-texte-doux">Non catégorisé</span>
            )}
            <span className="text-[11px] font-black text-texte-doux">
              {isExpanded ? '▾' : '▸'}
            </span>
          </button>
        </td>
        <td className={TABLE_STYLES.cellCategory}>{group.records.length}</td>
        <td className={`${TABLE_STYLES.cellAmount} ${group.totalAmount < 0 ? 'text-depasse' : 'text-ok'}`}>
          {group.totalAmount.toFixed(2)} €
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={3} className="bg-surface p-3">
            <div className="overflow-hidden rounded-xl border border-bordure/60 bg-white/40">
              <table className="w-full min-w-0 border-collapse text-left text-[11px] sm:text-sm">
                <thead>
                  <tr className="bg-surface-douce text-texte">
                    <th className="px-2 py-2 font-bold sm:px-3">Date</th>
                    <th className="px-2 py-2 font-bold sm:px-3">Libellé</th>
                    <th className="px-2 py-2 text-right font-bold sm:px-3">Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {group.records.map((transaction) => (
                    <tr key={transaction.id} className="border-t border-bordure/40 align-top">
                      <td className="px-2 py-2 text-texte sm:px-3">{transaction.date}</td>
                      <td className="max-w-[160px] break-words px-2 py-2 text-texte sm:px-3">
                        {transaction.label || transaction.detail}
                      </td>
                      <td className={`px-2 py-2 text-right font-semibold sm:px-3 ${transaction.amount < 0 ? 'text-depasse' : 'text-ok'}`}>
                        {transaction.amount.toFixed(2)} €
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function CsvTransactionsTable({ transactions, isDemo = false }: CsvTransactionsTableProps) {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [isSavingLabels, setIsSavingLabels] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSavingTransactions, setIsSavingTransactions] = useState(false);
  const [transactionsMessage, setTransactionsMessage] = useState<string | null>(null);
  const [transactionsError, setTransactionsError] = useState<string | null>(null);
  const groups = groupTransactionsByCategory(transactions);
  const categorizedCount = transactions.filter((transaction) => transaction.categoryKey).length;
  const unmatchedExamples = Array.from(
    new Set(
      transactions
        .filter((transaction) => !transaction.categoryKey)
        .map((transaction) => transaction.detail.trim())
        .filter(Boolean),
    ),
  ).slice(0, 3);
  const importedLabels = useMemo(
    () => transactions.flatMap((transaction) => {
      if (!transaction.label || !transaction.categoryId || !transaction.categoryKey) return [];

      return [{
        label: transaction.label,
        key: transaction.categoryKey,
        categoryId: transaction.categoryId,
      }];
    }),
    [transactions],
  );

  const toggleGroup = (categoryLabel: string) => {
    setExpandedGroups((previous) => ({
      ...previous,
      [categoryLabel]: !previous[categoryLabel],
    }));
  };

  const handleSaveLabels = async () => {
    setIsSavingLabels(true);
    setSaveMessage(null);
    setSaveError(null);

    try {
      const result = await saveImportedTransactionLabels(importedLabels);
      setSaveMessage(
        `${result.inserted} libellé${result.inserted > 1 ? 's' : ''} ajouté${result.inserted > 1 ? 's' : ''}, ${result.updated} mis à jour, ${result.skipped} déjà connu${result.skipped > 1 ? 's' : ''}.`,
      );
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "Impossible d'enregistrer les libellés de transaction.",
      );
    } finally {
      setIsSavingLabels(false);
    }
  };

  const handleSaveTransactions = async () => {
    setIsSavingTransactions(true);
    setTransactionsMessage(null);
    setTransactionsError(null);

    try {
      const result = await saveImportedTransactions(transactions);
      const plural = (count: number) => (count > 1 ? 's' : '');
      const parts = [`${result.inserted} transaction${plural(result.inserted)} enregistrée${plural(result.inserted)}`];
      if (result.duplicates > 0) {
        parts.push(`${result.duplicates} déjà présente${plural(result.duplicates)}`);
      }
      if (result.archived > 0) {
        parts.push(`${result.archived} ignorée${plural(result.archived)} (mois archivé)`);
      }
      if (result.invalid > 0) {
        parts.push(`${result.invalid} ignorée${plural(result.invalid)} (date illisible)`);
      }
      setTransactionsMessage(`${parts.join(', ')}.`);
    } catch (error) {
      setTransactionsError(
        error instanceof Error ? error.message : "Impossible d'enregistrer les transactions.",
      );
    } finally {
      setIsSavingTransactions(false);
    }
  };

  if (transactions.length === 0) return null;

  return (
    <section className="space-y-4 rounded-carte border-[3px] border-dashed border-bordure bg-surface-douce p-3 shadow-bonbon sm:p-4">
      <SectionStack
        label="Parties de l'import"
        background="surface-douce"
        sections={[
          {
            id: 'transactions',
            label: `Transactions lues (${transactions.length})`,
            hideTitle: true,
            content: (
              <div className="space-y-4">
          <p className="px-2 text-sm font-semibold text-texte-doux" role="status">
            {categorizedCount} catégorisée{categorizedCount !== 1 ? 's' : ''} sur {transactions.length}
          </p>
          {categorizedCount === 0 && unmatchedExamples.length > 0 && (
            <p className="rounded-lg border border-bordure bg-white/50 p-3 text-sm text-texte-doux" role="alert">
              Aucun détail ne correspond aux labels de <code>libelle_transacts</code>. Exemples lus : {unmatchedExamples.join(' | ')}
            </p>
          )}
          <div role="region" aria-label="Transactions importées" tabIndex={0} className="max-w-full overflow-x-auto rounded-xl border border-bordure/50 shadow-inner">
            <table className="w-full min-w-0 border-collapse text-left" aria-label="Synthèse par catégorie des transactions importées du CSV">
              <thead>
                <tr className="bg-surface-douce text-texte">
                  <th scope="col" className={TABLE_STYLES.thCategory}>Groupe / Catégorie</th>
                  <th scope="col" className={TABLE_STYLES.thCategory}>Nb items</th>
                  <th scope="col" className={TABLE_STYLES.thAmount}>Montant</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((group) => (
                  <CategoryRows
                    key={group.categoryLabel}
                    group={group}
                    isExpanded={Boolean(expandedGroups[group.categoryLabel])}
                    onToggle={() => toggleGroup(group.categoryLabel)}
                  />
                ))}
              </tbody>
            </table>
          </div>
          {isDemo && (
            <p className="rounded-lg border border-bordure bg-white/60 p-3 text-sm font-semibold text-texte-doux" role="status">
              🧪 Exemple : rien n’est enregistré. Importe ton vrai relevé pour retrouver tes opérations.
            </p>
          )}
          <div className="flex flex-wrap justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleSaveTransactions}
              disabled={isSavingTransactions || isDemo}
              className="rounded-carte border-[3px] border-bordure bg-accent px-6 py-3 font-black text-sur-accent shadow-bonbon transition-transform hover:translate-y-[2px] focus:outline-none focus:ring-2 focus:ring-focus disabled:cursor-not-allowed disabled:opacity-55"
            >
              {isSavingTransactions ? 'Enregistrement...' : `Enregistrer les ${transactions.length} transactions`}
            </button>
            <button
              type="button"
              onClick={handleSaveLabels}
              disabled={isSavingLabels || isDemo || importedLabels.length === 0}
              className="rounded-carte border-[3px] border-bordure bg-ok-fond px-6 py-3 font-black text-ok shadow-bonbon transition-transform hover:translate-y-[2px] focus:outline-none focus:ring-2 focus:ring-ok disabled:cursor-not-allowed disabled:opacity-55"
            >
              {isSavingLabels ? 'Enregistrement...' : 'Enregistrer les libellés reconnus'}
            </button>
          </div>
          {transactionsMessage && (
            <p className="text-sm font-semibold text-green-800" role="status">
              {transactionsMessage}
            </p>
          )}
          {transactionsError && (
            <p className="text-sm font-semibold text-red-700" role="alert">
              {transactionsError}
            </p>
          )}
          {saveMessage && (
            <p className="text-sm font-semibold text-green-800" role="status">
              {saveMessage}
            </p>
          )}
          {saveError && (
            <p className="text-sm font-semibold text-red-700" role="alert">
              {saveError}
            </p>
          )}
          {importedLabels.length === 0 && (
            <p className="text-sm italic text-texte-doux">
              Aucun libellé reconnu à enregistrer dans la table de correspondance.
            </p>
          )}
              </div>
            ),
          },
          {
            id: 'comparison',
            label: 'Comparaison avec le budget',
            hideTitle: true,
            content: <MonthlyBudgetComparison groups={groups} />,
          },
        ]}
      />
    </section>
  );
}