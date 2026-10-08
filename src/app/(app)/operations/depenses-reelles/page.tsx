"use client";

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MONTHS } from '@/constants/tableStyles';
import { ROUTES } from '@/constants/routes';
import MonthlyBudgetComparison, {
  type ComparisonGroup,
} from '@/components/features/tables/MonthlyBudgetComparison';
import BudgetVsActualDonuts from '@/components/features/charts/BudgetVsActualDonuts';
import BalanceToggle, { revealAmount, useBalanceVisibility } from '@/components/ui/BalanceToggle';
import ScreenCard from '@/components/ui/ScreenCard';
import SectionStack from '@/components/ui/SectionStack';
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
  action?: ReactNode;
}

const TONE_CLASSES: Record<NonNullable<SummaryCardProps['tone']>, string> = {
  neutral: 'text-[#5d4d44]',
  positive: 'text-[#3c763d]',
  negative: 'text-[#9c3633]',
  warning: 'text-[#8a4a1c]',
};

function SummaryCard({ label, value, tone = 'neutral', action }: SummaryCardProps) {
  return (
    <div className="rounded-xl border border-[#d8b7a5] bg-[#fff8f2] px-2 py-1.5 shadow-sm sm:rounded-2xl sm:px-3 sm:py-2">
      <dt className="text-[0.6rem] font-semibold uppercase leading-tight tracking-[0.08em] text-[#6b574c] sm:text-[0.7rem]">{label}</dt>
      <dd className={`flex items-center justify-between gap-1 text-sm font-black sm:text-lg ${TONE_CLASSES[tone]}`}>
        {value}
        {action}
      </dd>
    </div>
  );
}

export default function DepenseReellePage() {
  const balance = useBalanceVisibility();
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

  const monthNav = (
    <div className="flex items-center gap-1 rounded-xl border border-[#d8b7a5] bg-white/70 p-1">
      <button
        type="button"
        onClick={() => goToMonth(-1)}
        aria-label="Mois précédent"
        className="flex h-11 w-11 items-center justify-center rounded-lg text-[#5d4d44] transition hover:bg-white focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#5b473d]"
      >
        <ChevronLeft size={18} aria-hidden="true" />
      </button>
      <span className="min-w-[7.5rem] text-center text-sm font-bold text-[#5d4d44]" aria-live="polite">
        {MONTHS[monthIndex].label} {year}
      </span>
      <button
        type="button"
        onClick={() => goToMonth(1)}
        aria-label="Mois suivant"
        className="flex h-11 w-11 items-center justify-center rounded-lg text-[#5d4d44] transition hover:bg-white focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#5b473d]"
      >
        <ChevronRight size={18} aria-hidden="true" />
      </button>
    </div>
  );

  return (
    <ScreenCard flow title="Bilan du mois" icon="📊" subtitle="Ce que tu as vraiment dépensé, comparé à ton budget." actions={monthNav}>
      <div className="flex flex-col gap-2 md:h-full md:min-h-0">
        {isLoading && (
          <p className="py-8 text-center text-sm font-semibold text-[#6b574c]" role="status">
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
            <div className="rounded-[1.5rem] border-[3px] border-dashed border-[#d7b59d] bg-[#f5eadf] p-6 text-center">
              <p className="text-lg font-bold text-[#5a473d]">
                Aucune transaction en {MONTHS[monthIndex].label.toLowerCase()} {year}.
              </p>
              <p className="mt-1 text-sm text-[#6b574c]">
                Commence par importer ton relevé CSV : c’est la première étape.
              </p>
              <Link
                href={ROUTES.import}
                className="mt-3 inline-flex min-h-12 items-center rounded-[1.25rem] border-[3px] border-[#e4a58f] bg-[#e59a86] px-5 py-2 font-bold text-[#3d2a21] shadow-[0_4px_0_rgba(171,98,77,0.85)] transition-transform hover:translate-y-[2px]"
              >
                Aller à l&apos;import CSV
              </Link>
            </div>
          ) : (
            <>
              <dl className="grid shrink-0 grid-cols-2 gap-1.5 sm:grid-cols-4 sm:gap-2">
                <SummaryCard label="Revenus" value={euroFormatter.format(totals.income)} tone="positive" />
                <SummaryCard label="Dépenses" value={euroFormatter.format(totals.expenses)} tone="negative" />
                <SummaryCard
                  label="Solde du mois"
                  value={revealAmount(balance.isShown, signedEuroFormatter.format(totals.net))}
                  tone={balance.isShown && totals.net < 0 ? 'negative' : 'positive'}
                  action={<BalanceToggle isShown={balance.isShown} onToggle={balance.toggle} className="size-9 text-base" />}
                />
                <SummaryCard
                  label="À catégoriser"
                  value={String(breakdown.uncategorized.length)}
                  tone={breakdown.uncategorized.length > 0 ? 'warning' : 'neutral'}
                />
              </dl>

              {breakdown.uncategorized.length > 0 && (
                <Link
                  href={ROUTES.reconciliation}
                  className="flex min-h-11 shrink-0 items-center justify-between gap-2 rounded-2xl border-2 border-[#d6a85c] bg-[#fff1da] px-4 text-sm font-bold text-[#5a3d10] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#5b473d]"
                >
                  <span>{breakdown.uncategorized.length} opération{breakdown.uncategorized.length > 1 ? 's' : ''} sans catégorie</span>
                  <span aria-hidden="true">Pointer →</span>
                  <span className="sr-only">Aller pointer les opérations</span>
                </Link>
              )}

              <SectionStack
                label="Parties des dépenses du mois"
                sections={[
                  {
                    id: 'overview',
                    label: 'Budget et réel',
                    content: (
                      <BudgetVsActualDonuts
                        year={year}
                        monthIndex={monthIndex}
                        monthLabel={MONTHS[monthIndex].label}
                        transactions={data.transactions}
                        categories={data.categories}
                        categoryGroups={data.categoryGroups}
                      />
                    ),
                  },
                  {
                    id: 'comparison',
                    label: 'Écarts par catégorie',
                    content: (
                      <section className="rounded-[1.5rem] border-[3px] border-dashed border-[#d7b59d] bg-[#f5eadf] p-3">
                        <MonthlyBudgetComparison
                          key={year}
                          groups={comparisonGroups}
                          monthIndex={monthIndex}
                          year={year}
                        />
                      </section>
                    ),
                  },
                  {
                    id: 'detail',
                    label: `Opérations (${totals.count})`,
                    content: (
                      <section aria-label="Détail des opérations" className="space-y-3 rounded-[1.5rem] border-[3px] border-dashed border-[#d7b59d] bg-[#f5eadf] p-3">
                        <StoredTransactionsBreakdown breakdown={breakdown} />
                      </section>
                    ),
                  },
                ]}
              />
            </>
          )
        )}
      </div>
    </ScreenCard>
  );
}
