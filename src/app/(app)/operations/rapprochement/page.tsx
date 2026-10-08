"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
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

    return () => {
      isCurrent = false;
    };
  }, []);

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
      () =>
        setData((current) =>
          current && {
            ...current,
            transactions: current.transactions.filter((item) => !ids.includes(item.id)),
          },
        ),
    );
  };

  const transactions = data?.transactions ?? [];
  const readyIds = transactions.filter((item) => item.category_id).map((item) => item.id);
  const toCategorizeCount = transactions.length - readyIds.length;

  return (
    <div className="min-h-[60vh] bg-[#ebcfc6] px-4 py-6 font-sans text-[#5b473d] sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1200px] space-y-6 rounded-[2.2rem] border-[3px] border-[#d8b6a5] bg-[#f2e6d8] p-4 shadow-[inset_0_0_0_3px_rgba(255,255,255,0.18)] sm:p-6">
        <div className="flex flex-col gap-3 px-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-[clamp(1.5rem,2.5vw,2.4rem)] font-black tracking-[-0.05em] text-[#5d4d44]">
              Rapprochement
            </h1>
            <p className="mt-1 text-sm text-[#6b574c]">
              Vérifie la catégorie de chaque opération puis pointe-la : elle compte alors dans la ligne de budget de sa catégorie.
            </p>
          </div>

          {readyIds.length > 0 && (
            <button
              type="button"
              onClick={() => reconcile(readyIds)}
              disabled={readyIds.some((id) => busyIds.has(id))}
              className="rounded-xl border border-[#b88f78] bg-white/70 px-4 py-2.5 text-sm font-bold text-[#5d4d44] transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#5d4d44] disabled:opacity-50"
            >
              Tout pointer ({readyIds.length})
            </button>
          )}
        </div>

        {!data && !loadError && (
          <p className="py-10 text-center text-sm font-semibold text-[#6b574c]" role="status">
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

        {data && transactions.length === 0 && (
          <div className="rounded-[2rem] border-[3px] border-dashed border-[#d7b59d] bg-[#f5eadf] p-8 text-center">
            <p className="text-lg font-bold text-[#5a473d]">Tout est rapproché.</p>
            <p className="mt-2 text-sm text-[#6b574c]">
              Les nouvelles opérations apparaîtront ici après un import de relevé.
            </p>
            <Link
              href="/operations/import"
              className="mt-4 inline-block rounded-[1.25rem] border-[3px] border-[#e4a58f] bg-[#e59a86] px-5 py-2.5 font-bold text-[#3d2a21] shadow-[0_4px_0_rgba(171,98,77,0.85)] transition-transform hover:translate-y-[2px]"
            >
              Importer un relevé
            </Link>
          </div>
        )}

        {data && transactions.length > 0 && (
          <section className="space-y-3 rounded-[2rem] border-[3px] border-dashed border-[#d7b59d] bg-[#f5eadf] p-3 shadow-[0_3px_0_rgba(140,103,86,0.12)] sm:p-4">
            <h2 className="px-2 text-[1.2rem] font-black text-[#5d4d44]">
              {transactions.length} opération{transactions.length > 1 ? 's' : ''} à rapprocher
              {toCategorizeCount > 0 && (
                <span className="ml-2 text-sm font-semibold text-[#8a4a1c]">
                  dont {toCategorizeCount} sans catégorie
                </span>
              )}
            </h2>

            <ul className="space-y-2">
              {transactions.map((transaction) => {
                const amount = Number(transaction.amount);
                const isBusy = busyIds.has(transaction.id);
                const monthLabel = MONTHS[Number(transaction.booked_on.slice(5, 7)) - 1]?.label;

                return (
                  <li
                    key={transaction.id}
                    className="grid items-center gap-3 rounded-2xl border border-[#d8b7a5] bg-[#fff8f2] p-3 md:grid-cols-[8rem_1fr_9rem_14rem_auto]"
                  >
                    <div className="text-sm font-semibold text-[#6b574c]">
                      {formatDate(transaction.booked_on)}
                      {monthLabel && <span className="sr-only"> ({monthLabel})</span>}
                    </div>
                    <div className="min-w-0 break-words text-sm font-bold text-[#5d4d44]">{transaction.label}</div>
                    <div className={`text-sm font-black ${amount < 0 ? 'text-[#b94a48]' : 'text-[#3c763d]'}`}>
                      {signedEuroFormatter.format(amount)}
                    </div>

                    <select
                      aria-label={`Catégorie de l'opération ${transaction.label}`}
                      value={transaction.category_id ?? ''}
                      disabled={isBusy}
                      onChange={(event) => changeCategory(transaction, event.target.value)}
                      className="w-full rounded-lg border border-[#d8b7a5] bg-white px-2 py-2 text-sm text-[#5d4d44] disabled:opacity-50"
                    >
                      <option value="">— Sans catégorie —</option>
                      {data.categoryGroups.map((group) => {
                        const groupCategories = data.categories.filter(
                          (category) => category.cat_group_key === group.id,
                        );
                        if (groupCategories.length === 0) return null;

                        return (
                          <optgroup key={group.id} label={group.libelle}>
                            {groupCategories.map((category) => (
                              <option key={category.id} value={category.id}>
                                {category.label}
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
                      className="rounded-lg border border-[#b88f78] bg-white/70 px-3 py-2 text-sm font-bold text-[#5d4d44] transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#5d4d44] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Pointer
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
