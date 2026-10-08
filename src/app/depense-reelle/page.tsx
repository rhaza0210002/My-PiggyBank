"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MONTHS } from '@/constants/tableStyles';
import MonthlyBudgetComparison, {
  type ComparisonGroup,
} from '@/components/features/tables/MonthlyBudgetComparison';
import StoredTransactionsBreakdown from '@/components/features/tables/StoredTransactionsBreakdown';
import {
  getCategories,
  getCategoriesGroupKey,
  type Category,
  type CategoryGroup,
} from '@/services/transactionCategoryService';
import {
  getTransactionsForMonth,
  summarizeAmounts,
  type StoredTransaction,
} from '@/services/transactionService';
import { euroFormatter, signedEuroFormatter } from '@/utils/formatEuro';
import { groupStoredTransactions } from '@/utils/storedTransactionGrouping';

interface LoadedMonth {
  requestKey: string;
  transactions: StoredTransaction[];
  categories: Category[];
  categoryGroups: CategoryGroup[];
  error: string | null;
}

interface SummaryCardProps {
  label: string;
  value: string;
  tone?: 'neutral' | 'positive' | 'negative' | 'warning';
}

const TONE_CLASSES: Record<NonNullable<SummaryCardProps['tone']>, string> = {
  neutral: 'text-[#5d4d44]',
  positive: 'text-[#3c763d]',
  negative: 'text-[#b94a48]',
  warning: 'text-[#a85a2a]',
};

function SummaryCard({ label, value, tone = 'neutral' }: SummaryCardProps) {
  return (
    <div className="rounded-2xl border border-[#d8b7a5] bg-[#fff8f2] p-4 shadow-sm">
      <dt className="text-xs font-semibold uppercase tracking-[0.15em] text-[#8c7366]">{label}</dt>
      <dd className={`mt-1 text-xl font-black ${TONE_CLASSES[tone]}`}>{value}</dd>
    </div>
  );
}

export default function DepenseReellePage() {
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [monthIndex, setMonthIndex] = useState(() => new Date().getMonth());
  const [loaded, setLoaded] = useState<LoadedMonth | null>(null);

  const requestKey = `${year}-${monthIndex}`;
  const isLoading = loaded?.requestKey !== requestKey;

  useEffect(() => {
    let isCurrent = true;

    Promise.all([getTransactionsForMonth(year, monthIndex), getCategories(), getCategoriesGroupKey()])
      .then(([transactions, categories, categoryGroups]) => {
        if (!isCurrent) return;
        setLoaded({ requestKey, transactions, categories, categoryGroups, error: null });
      })
      .catch((error: unknown) => {
        if (!isCurrent) return;
        setLoaded({
          requestKey,
          transactions: [],
          categories: [],
          categoryGroups: [],
          error: error instanceof Error ? error.message : 'Impossible de charger les dépenses réelles.',
        });
      });

    return () => {
      isCurrent = false;
    };
  }, [year, monthIndex, requestKey]);

  const goToMonth = (offset: number) => {
    const target = year * 12 + monthIndex + offset;
    setYear(Math.floor(target / 12));
    setMonthIndex(target % 12);
  };

  const data = loaded && !isLoading ? loaded : null;
  const breakdown = data
    ? groupStoredTransactions(data.transactions, data.categories, data.categoryGroups)
    : null;
  const totals = data ? summarizeAmounts(data.transactions.map((transaction) => Number(transaction.amount))) : null;

  const comparisonGroups: ComparisonGroup[] = breakdown
    ? [
        ...breakdown.groups.flatMap((group) =>
          group.categories.map((category) => ({
            categoryId: category.categoryId,
            totalAmount: category.total,
            records: category.transactions,
          })),
        ),
        ...(breakdown.uncategorized.length > 0
          ? [{
              categoryId: null,
              totalAmount: breakdown.uncategorized.reduce((sum, transaction) => sum + Number(transaction.amount), 0),
              records: breakdown.uncategorized,
            }]
          : []),
      ]
    : [];

  return (
    <main className="min-h-screen bg-[#ebcfc6] px-4 py-6 font-sans text-[#5b473d] sm:px-6 lg:px-10">
      <div className="mb-6 flex justify-start">
        <Link
          href="/dashboard"
          aria-label="Retour au tableau de bord"
          className="rounded-[1.25rem] border-[3px] border-[#e4a58f] bg-[#e59a86] px-5 py-2.5 text-center text-[1rem] font-bold text-[#fff8f5] shadow-[0_4px_0_rgba(171,98,77,0.85)] transition-transform hover:translate-y-[2px] focus:outline-none focus:ring-2 focus:ring-[#5b473d]"
        >
          ← Retour
        </Link>
      </div>

      <div className="mx-auto max-w-[1200px] space-y-6 rounded-[2.2rem] border-[3px] border-[#d8b6a5] bg-[#f2e6d8] p-4 shadow-[inset_0_0_0_3px_rgba(255,255,255,0.18)] sm:p-6">
        <div className="flex flex-col gap-4 px-2 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-[clamp(1.5rem,2.5vw,2.4rem)] font-black tracking-[-0.05em] text-[#5d4d44]">
            Dépenses réelles
          </h1>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 rounded-xl border border-[#d8b7a5] bg-white/70 p-1">
              <button
                type="button"
                onClick={() => goToMonth(-1)}
                aria-label="Mois précédent"
                className="rounded-lg p-2 text-[#5d4d44] transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#5d4d44]"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="min-w-[8.5rem] text-center text-sm font-bold text-[#5d4d44]" aria-live="polite">
                {MONTHS[monthIndex].label} {year}
              </span>
              <button
                type="button"
                onClick={() => goToMonth(1)}
                aria-label="Mois suivant"
                className="rounded-lg p-2 text-[#5d4d44] transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#5d4d44]"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <Link
              href="/csvUploader"
              className="rounded-xl border border-[#b88f78] bg-white/70 px-4 py-2.5 text-sm font-bold text-[#5d4d44] transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#5d4d44]"
            >
              Importer un relevé
            </Link>
          </div>
        </div>

        {isLoading && (
          <p className="py-10 text-center text-sm font-semibold text-[#766356]" role="status">
            Chargement des dépenses de {MONTHS[monthIndex].label.toLowerCase()}…
          </p>
        )}

        {data?.error && (
          <p role="alert" className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm font-semibold text-red-800">
            {data.error}
          </p>
        )}

        {data && !data.error && totals && breakdown && (
          totals.count === 0 ? (
            <div className="rounded-[2rem] border-[3px] border-dashed border-[#d7b59d] bg-[#f5eadf] p-8 text-center">
              <p className="text-lg font-bold text-[#5a473d]">
                Aucune transaction enregistrée en {MONTHS[monthIndex].label.toLowerCase()} {year}.
              </p>
              <p className="mt-2 text-sm text-[#8c7366]">
                Importe un relevé CSV, puis clique sur « Enregistrer les transactions ».
              </p>
              <Link
                href="/csvUploader"
                className="mt-4 inline-block rounded-[1.25rem] border-[3px] border-[#e4a58f] bg-[#e59a86] px-5 py-2.5 font-bold text-[#fff8f5] shadow-[0_4px_0_rgba(171,98,77,0.85)] transition-transform hover:translate-y-[2px]"
              >
                Aller à l&apos;import CSV
              </Link>
            </div>
          ) : (
            <>
              <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <SummaryCard label="Revenus" value={euroFormatter.format(totals.income)} tone="positive" />
                <SummaryCard label="Dépenses" value={euroFormatter.format(totals.expenses)} tone="negative" />
                <SummaryCard
                  label="Solde du mois"
                  value={signedEuroFormatter.format(totals.net)}
                  tone={totals.net < 0 ? 'negative' : 'positive'}
                />
                <SummaryCard
                  label="À catégoriser"
                  value={String(breakdown.uncategorized.length)}
                  tone={breakdown.uncategorized.length > 0 ? 'warning' : 'neutral'}
                />
              </dl>

              <section className="rounded-[2rem] border-[3px] border-dashed border-[#d7b59d] bg-[#f5eadf] p-3 shadow-[0_3px_0_rgba(140,103,86,0.12)] sm:p-4">
                <MonthlyBudgetComparison
                  key={year}
                  groups={comparisonGroups}
                  monthIndex={monthIndex}
                  year={year}
                />
              </section>

              <section className="space-y-4 rounded-[2rem] border-[3px] border-dashed border-[#d7b59d] bg-[#f5eadf] p-3 shadow-[0_3px_0_rgba(140,103,86,0.12)] sm:p-4">
                <h2 className="px-2 text-[1.4rem] font-black text-[#5d4d44]">
                  Détail des opérations ({totals.count})
                </h2>
                <StoredTransactionsBreakdown breakdown={breakdown} />
              </section>
            </>
          )
        )}
      </div>
    </main>
  );
}
