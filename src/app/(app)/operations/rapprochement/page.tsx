"use client";

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import LabelRuleForm from '@/components/features/forms/LabelRuleForm';
import NewCategoryForm from '@/components/features/forms/NewCategoryForm';
import ProgressBar from '@/components/ui/ProgressBar';
import ScreenCard from '@/components/ui/ScreenCard';
import { useGamification } from '@/hooks/useGamification';
import { XP_PER_OPERATION } from '@/utils/gamification';
import { isCurrentUserAdmin } from '@/services/adminService';
import { ROUTES } from '@/constants/routes';
import {
  getCategories,
  getCategoriesGroupKey,
  type Category,
  type CategoryGroup,
} from '@/services/transactionCategoryService';
import {
  getTransactionsToReconcile,
  markTransactionsReconciled,
  updateTransactionCategory,
  type StoredTransaction,
} from '@/services/transactionService';
import { MONTHS } from '@/constants/tableStyles';
import { signedEuroFormatter } from '@/utils/formatEuro';

const PAGE_SIZE = 200;

interface LoadedData {
  transactions: StoredTransaction[];
  categories: Category[];
  categoryGroups: CategoryGroup[];
}

function formatDate(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function RapprochementPage() {
  const [data, setData] = useState<LoadedData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyIds, setBusyIds] = useState<ReadonlySet<string>>(new Set());
  const [isAdmin, setIsAdmin] = useState(false);
  const [ruleTransactionId, setRuleTransactionId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const { data: progress, refresh: refreshProgress } = useGamification();
  const wasMonthComplete = useRef<boolean | null>(null);
  const [celebration, setCelebration] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;

    Promise.all([getTransactionsToReconcile(PAGE_SIZE), getCategories(), getCategoriesGroupKey()])
      .then(([transactions, categories, categoryGroups]) => {
        if (isCurrent) setData({ transactions, categories, categoryGroups });
      })
      .catch((error: unknown) => {
        if (!isCurrent) return;
        setLoadError(error instanceof Error ? error.message : 'Impossible de charger les opérations.');
      });

    isCurrentUserAdmin().then((admin) => {
      if (isCurrent) setIsAdmin(admin);
    });

    return () => {
      isCurrent = false;
    };
  }, []);

  useEffect(() => {
    if (!progress) return;
    const isComplete = progress.currentMonth.status === 'complete';
    if (wasMonthComplete.current === false && isComplete) {
      setCelebration('Mois bouclé ! Toutes les opérations du mois sont pointées. Bravo, c’est gagné pour de bon.');
    }
    wasMonthComplete.current = isComplete;
  }, [progress]);

  const setBusy = (ids: string[], busy: boolean) => {
    setBusyIds((previous) => {
      const next = new Set(previous);
      ids.forEach((id) => (busy ? next.add(id) : next.delete(id)));
      return next;
    });
  };

  const runAction = async (ids: string[], action: () => Promise<void>, onDone: () => void) => {
    setActionError(null);
    setBusy(ids, true);
    try {
      await action();
      onDone();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Action impossible.');
    } finally {
      setBusy(ids, false);
    }
  };

  const changeCategory = (transaction: StoredTransaction, categoryId: string) => {
    const nextCategoryId = categoryId === '' ? null : categoryId;

    void runAction(
      [transaction.id],
      () => updateTransactionCategory(transaction.id, nextCategoryId),
      () =>
        setData((current) =>
          current && {
            ...current,
            transactions: current.transactions.map((item) =>
              item.id === transaction.id ? { ...item, category_id: nextCategoryId, category_key: null } : item,
            ),
          },
        ),
    );
  };

  const reconcile = (ids: string[]) => {
    void runAction(
      ids,
      () => markTransactionsReconciled(ids),
      () => {
        setData((current) =>
          current && {
            ...current,
            transactions: current.transactions.filter((item) => !ids.includes(item.id)),
          },
        );
        setNotice(`+${ids.length * XP_PER_OPERATION} points : ${ids.length} opération${ids.length > 1 ? 's' : ''} pointée${ids.length > 1 ? 's' : ''}. Bien joué !`);
        refreshProgress();
      },
    );
  };

  const transactions = data?.transactions ?? [];
  const readyIds = transactions.filter((item) => item.category_id).map((item) => item.id);
  const toCategorizeCount = transactions.length - readyIds.length;
  const month = progress?.currentMonth;

  return (
    <ScreenCard
      title="Rapprochement"
      subtitle="Choisis la catégorie, puis pointe : l’opération compte alors dans ton budget."
      actions={
        readyIds.length > 0 ? (
          <button
            type="button"
            onClick={() => reconcile(readyIds)}
            disabled={readyIds.some((id) => busyIds.has(id))}
            className="min-h-11 rounded-xl border border-[#b88f78] bg-white/70 px-4 text-sm font-bold text-[#5d4d44] transition hover:bg-white focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#5b473d] disabled:opacity-50"
          >
            Tout pointer ({readyIds.length})
          </button>
        ) : null
      }
    >
      <div className="space-y-2">
        {month && month.total > 0 && (
          <div className="flex flex-col gap-1 rounded-2xl border border-[#e5c4b4] bg-[#fff8f2] px-3 py-2 sm:flex-row sm:items-center sm:gap-4">
            <p className="shrink-0 text-sm font-bold text-[#5a4d41]">
              Ce mois-ci : {month.done} / {month.total} pointées
            </p>
            <div className="min-w-0 flex-1">
              <ProgressBar value={month.done} max={month.total} label="Opérations du mois pointées" valueText={`${month.done} sur ${month.total}`} />
            </div>
            {progress && (
              <p className="shrink-0 text-xs font-semibold text-[#6b574c]">
                Niveau {progress.levelInfo.level} · {progress.xp} points
              </p>
            )}
          </div>
        )}

        {celebration && (
          <p role="status" className="motion-safe:animate-[pop_0.6s_ease-out_1] rounded-2xl border-2 border-[#d6a85c] bg-[#fff1da] p-3 text-center text-base font-black text-[#5a3d10]">
            <span aria-hidden="true">🎉 </span>
            {celebration}
          </p>
        )}

        {notice && !celebration && (
          <p role="status" className="rounded-lg border border-[#9fc3a1] bg-[#eaf4e6] p-2 text-sm font-semibold text-[#1f4d25]">
            {notice}
          </p>
        )}

        {!data && !loadError && (
          <p className="py-6 text-center text-sm font-semibold text-[#6b574c]" role="status">
            Chargement des opérations…
          </p>
        )}

        {loadError && (
          <p role="alert" className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm font-semibold text-red-800">
            {loadError}
          </p>
        )}

        {actionError && (
          <p role="alert" className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm font-semibold text-red-800">
            {actionError}
          </p>
        )}

        {data && isAdmin && (
          <details className="rounded-2xl border border-dashed border-[#d7b59d] bg-[#f5eadf] px-3 py-1">
            <summary className="flex min-h-11 cursor-pointer items-center text-sm font-bold text-[#5d4d44]">
              Créer une catégorie (administrateur)
            </summary>
            <div className="pb-2">
              <NewCategoryForm
                groups={data.categoryGroups}
                categories={data.categories}
                onCreated={(category) =>
                  setData((current) =>
                    current && {
                      ...current,
                      categories: [...current.categories, category].sort((first, second) =>
                        first.label.localeCompare(second.label, 'fr'),
                      ),
                    },
                  )
                }
              />
            </div>
          </details>
        )}

        {data && transactions.length === 0 && (
          <div className="rounded-[1.5rem] border-[3px] border-dashed border-[#d7b59d] bg-[#f5eadf] p-6 text-center">
            <p className="text-lg font-bold text-[#5a473d]">Tout est rapproché. <span aria-hidden="true">✨</span></p>
            <p className="mt-1 text-sm text-[#6b574c]">
              Les nouvelles opérations apparaîtront ici après un import de relevé.
            </p>
            <Link
              href={ROUTES.import}
              className="mt-3 inline-flex min-h-12 items-center rounded-[1.25rem] border-[3px] border-[#e4a58f] bg-[#e59a86] px-5 py-2 font-bold text-[#3d2a21] shadow-[0_4px_0_rgba(171,98,77,0.85)] transition-transform hover:translate-y-[2px]"
            >
              Importer un relevé
            </Link>
          </div>
        )}

        {data && transactions.length > 0 && (
          <section aria-labelledby="pending-title" className="space-y-2">
            <h2 id="pending-title" className="px-1 text-base font-black text-[#5d4d44]">
              {transactions.length} opération{transactions.length > 1 ? 's' : ''} à rapprocher
              {toCategorizeCount > 0 && (
                <span className="ml-2 text-sm font-semibold text-[#8a4a1c]">dont {toCategorizeCount} sans catégorie</span>
              )}
            </h2>

            <ul className="space-y-2">
              {transactions.map((transaction) => {
                const amount = Number(transaction.amount);
                const isBusy = busyIds.has(transaction.id);
                const category = data.categories.find((item) => item.id === transaction.category_id);
                const monthLabel = MONTHS[Number(transaction.booked_on.slice(5, 7)) - 1]?.label;

                return (
                  <li
                    key={transaction.id}
                    className="grid items-center gap-x-3 gap-y-1 rounded-2xl border border-[#d8b7a5] bg-[#fff8f2] p-2 md:grid-cols-[6.5rem_1fr_7rem_13rem_auto] lg:grid-cols-[6.5rem_1fr_7rem_13rem_auto_auto]"
                  >
                    <div className="text-xs font-semibold text-[#6b574c] sm:text-sm">
                      {formatDate(transaction.booked_on)}
                      {monthLabel && <span className="sr-only"> ({monthLabel})</span>}
                    </div>
                    <div className="min-w-0 break-words text-sm font-bold text-[#5d4d44] [overflow-wrap:anywhere] md:line-clamp-2">{transaction.label}</div>
                    <div className={`text-sm font-black ${amount < 0 ? 'text-[#9c3633]' : 'text-[#2f5d32]'}`}>
                      {signedEuroFormatter.format(amount)}
                    </div>

                    <select
                      aria-label={`Catégorie de l'opération ${transaction.label}`}
                      value={transaction.category_id ?? ''}
                      disabled={isBusy}
                      onChange={(event) => changeCategory(transaction, event.target.value)}
                      className="min-h-11 w-full rounded-lg border-2 border-[#9c7560] bg-white px-2 text-sm text-[#5d4d44] disabled:opacity-50"
                    >
                      <option value="">— Sans catégorie —</option>
                      {data.categoryGroups.map((group) => {
                        const groupCategories = data.categories.filter(
                          (item) => item.cat_group_key === group.id,
                        );
                        if (groupCategories.length === 0) return null;

                        return (
                          <optgroup key={group.id} label={group.libelle}>
                            {groupCategories.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.label}
                              </option>
                            ))}
                          </optgroup>
                        );
                      })}
                    </select>

                    <button
                      type="button"
                      onClick={() => reconcile([transaction.id])}
                      disabled={isBusy || !transaction.category_id}
                      title={transaction.category_id ? undefined : 'Choisis une catégorie avant de pointer'}
                      className="min-h-11 rounded-lg border border-[#b88f78] bg-white/70 px-3 text-sm font-bold text-[#5d4d44] transition hover:bg-white focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#5b473d] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Pointer
                    </button>

                    {category && (
                      ruleTransactionId === transaction.id ? (
                        <div className="md:col-span-full">
                          <LabelRuleForm
                            transactionLabel={transaction.label}
                            category={category}
                            onCancel={() => setRuleTransactionId(null)}
                            onSaved={(message) => {
                              setRuleTransactionId(null);
                              setNotice(message);
                            }}
                          />
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setNotice(null);
                            setRuleTransactionId(transaction.id);
                          }}
                          className="min-h-11 justify-self-start rounded-lg px-2 text-left text-sm font-bold text-[#8c4a38] underline underline-offset-2 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#5b473d] md:col-span-full lg:col-auto"
                        >
                          Retenir ce libellé
                          <span className="sr-only"> pour les prochains imports ({transaction.label})</span>
                        </button>
                      )
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </div>
    </ScreenCard>
  );
}
