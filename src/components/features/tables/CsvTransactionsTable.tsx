"use client";

import { useState } from 'react';
import { TABLE_STYLES } from '@/constants/tableStyles';
import { getSimplifiedMerchantName } from '@/services/csvParser';
import {
  groupTransactionsByCategory,
  type CategoryTransactionGroup,
} from '@/utils/csvTransactionGrouping';
import type { BankTransaction } from '@/services/csvParser';

interface CsvTransactionsTableProps {
  transactions: BankTransaction[];
}

const categoryBackgrounds: Record<string, string> = {
  '1': 'bg-[#e8d5cc]/80',
  '2': 'bg-[#d5e2e8]/80',
  '3': 'bg-[#d5e8d6]/80',
  '4': 'bg-[#e8d5d5]/80',
  '5': 'bg-[#e8e5d5]/80',
  '6': 'bg-[#e2d5e8]/80',
  '7': 'bg-[#e5d5e8]/80',
  '8': 'bg-[#fffaca]/80',
  '9': 'bg-[#d5e8e5]/80',
  '10': 'bg-[#dda0dd]/80',
};

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
    ? categoryBackgrounds[group.categoryId] ?? 'bg-white/40'
    : 'bg-white/40';

  return (
    <>
      <tr className={`border-b border-[#d8b7a5]/30 transition-colors ${highlightClass}`}>
        <td className={TABLE_STYLES.cellCategory}>
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={isExpanded}
            className="flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1 text-left text-xs font-bold text-[#5d4d44] transition hover:bg-white/40"
          >
            {group.categoryId ? (
              <span className="rounded-full border border-[#d8b7a5] bg-white/75 px-2.5 py-1 shadow-sm">
                {group.categoryLabel}
              </span>
            ) : (
              <span className="italic text-gray-400">Non catégorisé</span>
            )}
            <span className="text-[11px] font-black text-[#6a534c]">
              {isExpanded ? '▾' : '▸'}
            </span>
          </button>
        </td>
        <td className={TABLE_STYLES.cellCategory}>{group.records.length}</td>
        <td className={`${TABLE_STYLES.cellAmount} ${group.totalAmount < 0 ? 'text-[#b94a48]' : 'text-[#3c763d]'}`}>
          {group.totalAmount.toFixed(2)} €
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={3} className="bg-[#f9f1ea] p-3">
            <div className="overflow-hidden rounded-xl border border-[#d8b7a5]/60 bg-white/40">
              <table className="w-full min-w-0 border-collapse text-left text-[11px] sm:text-sm">
                <thead>
                  <tr className="bg-[#efe0d6] text-[#5d4d44]">
                    <th className="px-2 py-2 font-bold sm:px-3">Date</th>
                    <th className="px-2 py-2 font-bold sm:px-3">Libellé</th>
                    <th className="px-2 py-2 text-right font-bold sm:px-3">Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {group.records.map((transaction) => (
                    <tr key={transaction.id} className="border-t border-[#d8b7a5]/40 align-top">
                      <td className="px-2 py-2 text-[#5d4d44] sm:px-3">{transaction.date}</td>
                      <td className="max-w-[160px] break-words px-2 py-2 text-[#5d4d44] sm:px-3">
                        {getSimplifiedMerchantName(transaction.detail)}
                      </td>
                      <td className={`px-2 py-2 text-right font-semibold sm:px-3 ${transaction.amount < 0 ? 'text-[#b94a48]' : 'text-[#3c763d]'}`}>
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

export default function CsvTransactionsTable({ transactions }: CsvTransactionsTableProps) {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const groups = groupTransactionsByCategory(transactions);

  const toggleGroup = (categoryLabel: string) => {
    setExpandedGroups((previous) => ({
      ...previous,
      [categoryLabel]: !previous[categoryLabel],
    }));
  };

  if (transactions.length === 0) return null;

  return (
    <section className="space-y-4 rounded-[2rem] border-[3px] border-dashed border-[#d7b59d] bg-[#f5eadf] p-3 shadow-[0_3px_0_rgba(140,103,86,0.12)] sm:p-4">
      <h2 className="px-2 text-[1.4rem] font-black text-[#5d4d44]">
        Transactions lues ({transactions.length})
      </h2>
      <div className="max-w-full overflow-x-auto rounded-xl border border-[#d8b7a5]/50 shadow-inner">
        <table className="w-full min-w-0 border-collapse text-left" aria-label="Synthèse par catégorie des transactions importées du CSV">
          <thead>
            <tr className="bg-[#f0d8c8] text-[#5a473d]">
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
      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={() => alert('Résultat prêt à être injecté en BDD !')}
          className="rounded-[1.5rem] border-[3px] border-[#82b89f] bg-[#8cd3b3] px-6 py-3 font-black text-[#2e4d3d] shadow-[0_4px_0_rgba(92,143,115,0.85)] transition-transform hover:translate-y-[2px] focus:outline-none focus:ring-2 focus:ring-[#2e4d3d]"
        >
          Enregistrer le résultat validé
        </button>
      </div>
    </section>
  );
}