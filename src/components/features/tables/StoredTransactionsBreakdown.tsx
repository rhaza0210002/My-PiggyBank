"use client";

import { useState } from 'react';
import { TABLE_STYLES } from '@/constants/tableStyles';
import { getBudgetGroupPalette } from '@/constants/budgetGroupPalette';
import type { StoredTransaction } from '@/services/transactionService';
import type { MonthBreakdown } from '@/utils/storedTransactionGrouping';
import { signedEuroFormatter } from '@/utils/formatEuro';

interface StoredTransactionsBreakdownProps {
  breakdown: MonthBreakdown;
}

function amountClass(amount: number): string {
  return amount < 0 ? 'text-[#b94a48]' : 'text-[#3c763d]';
}

// booked_on est une date ISO (aaaa-mm-jj) : on la découpe sans passer par Date pour éviter tout décalage de fuseau.
function formatShortDate(isoDate: string): string {
  return `${isoDate.slice(8, 10)}/${isoDate.slice(5, 7)}`;
}

function TransactionsList({ transactions }: { transactions: StoredTransaction[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#d8b7a5]/60 bg-white/40">
      <table className="w-full min-w-0 border-collapse text-left text-[11px] sm:text-sm">
        <thead>
          <tr className="bg-[#efe0d6] text-[#5d4d44]">
            <th scope="col" className="px-2 py-2 font-bold sm:px-3">Date</th>
            <th scope="col" className="px-2 py-2 font-bold sm:px-3">Libellé</th>
            <th scope="col" className="px-2 py-2 text-right font-bold sm:px-3">Montant</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction) => {
            const amount = Number(transaction.amount);
            return (
              <tr key={transaction.id} className="border-t border-[#d8b7a5]/40 align-top">
                <td className="px-2 py-2 text-[#5d4d44] sm:px-3">{formatShortDate(transaction.booked_on)}</td>
                <td className="max-w-[220px] break-words px-2 py-2 text-[#5d4d44] sm:px-3">{transaction.label}</td>
                <td className={`px-2 py-2 text-right font-semibold sm:px-3 ${amountClass(amount)}`}>
                  {signedEuroFormatter.format(amount)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function StoredTransactionsBreakdown({ breakdown }: StoredTransactionsBreakdownProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggle = (id: string) => setExpanded((previous) => ({ ...previous, [id]: !previous[id] }));

  return (
    <div className="space-y-5">
      {breakdown.uncategorized.length > 0 && (
        <section
          aria-labelledby="uncategorized-title"
          className="space-y-3 rounded-xl border border-[#d8846d] bg-[#fdf0ea] p-3"
        >
          <h3 id="uncategorized-title" className="text-lg font-black text-[#7a3b2a]">
            À catégoriser ({breakdown.uncategorized.length})
          </h3>
          <p className="text-sm text-[#7a3b2a]">
            Aucune règle de libellé ne correspond à ces opérations.
          </p>
          <TransactionsList transactions={breakdown.uncategorized} />
        </section>
      )}

      {breakdown.groups.map((group) => {
        const palette = getBudgetGroupPalette(group.key, group.title);

        return (
          <section
            key={group.id}
            aria-label={`Détail ${group.title}`}
            className={`overflow-hidden rounded-xl border ${palette.border} ${palette.section}`}
          >
            <h3 className={`flex items-center justify-between gap-3 px-4 py-3 font-black text-[#5d4d44] ${palette.header}`}>
              <span>{group.title}</span>
              <span className={amountClass(group.total)}>{signedEuroFormatter.format(group.total)}</span>
            </h3>

            <table className="w-full border-collapse text-left" aria-label={`Catégories de ${group.title}`}>
              <thead className="sr-only">
                <tr>
                  <th scope="col">Catégorie</th>
                  <th scope="col">Nombre d&apos;opérations</th>
                  <th scope="col">Montant</th>
                </tr>
              </thead>
              <tbody>
                {group.categories.map((category, index) => {
                  const isExpanded = Boolean(expanded[category.categoryId]);

                  return (
                    <ExpandableCategoryRows
                      key={category.categoryId}
                      stripeClass={index % 2 === 0 ? palette.rowEven : palette.rowOdd}
                      label={category.label}
                      count={category.transactions.length}
                      total={category.total}
                      isExpanded={isExpanded}
                      onToggle={() => toggle(category.categoryId)}
                      transactions={category.transactions}
                    />
                  );
                })}
              </tbody>
            </table>
          </section>
        );
      })}
    </div>
  );
}

interface ExpandableCategoryRowsProps {
  stripeClass: string;
  label: string;
  count: number;
  total: number;
  isExpanded: boolean;
  onToggle: () => void;
  transactions: StoredTransaction[];
}

function ExpandableCategoryRows({
  stripeClass,
  label,
  count,
  total,
  isExpanded,
  onToggle,
  transactions,
}: ExpandableCategoryRowsProps) {
  return (
    <>
      <tr className={stripeClass}>
        <td className={TABLE_STYLES.cellCategory}>
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={isExpanded}
            className="flex w-full items-center gap-2 rounded-lg px-1 py-1 text-left font-semibold text-[#5d4d44] transition hover:bg-white/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#5d4d44]"
          >
            <span aria-hidden="true" className="text-[11px] font-black text-[#6a534c]">{isExpanded ? '▾' : '▸'}</span>
            {label}
          </button>
        </td>
        <td className={`${TABLE_STYLES.cellCategory} whitespace-nowrap text-sm text-[#766356]`}>
          {count} op.
        </td>
        <td className={`${TABLE_STYLES.cellAmount} ${amountClass(total)}`}>
          {signedEuroFormatter.format(total)}
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={3} className="bg-[#f9f1ea] p-3">
            <TransactionsList transactions={transactions} />
          </td>
        </tr>
      )}
    </>
  );
}
