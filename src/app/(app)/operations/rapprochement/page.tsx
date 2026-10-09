"use client";

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import ReconcileCard from '@/components/features/reconciliation/ReconcileCard';
import NewCategoryForm from '@/components/features/forms/NewCategoryForm';
import Gauge from '@/components/ui/Gauge';
import ScreenCard from '@/components/ui/ScreenCard';
import { useGamification } from '@/hooks/useGamification';
import { suggestCategory, type LabeledCategory } from '@/utils/categorySuggestion';
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
  getPointedLabelHistory,
  getTransactionsToReconcile,
  markTransactionsReconciled,
  unreconcileTransactions,
  updateTransactionCategory,
  type StoredTransaction,
} from '@/services/transactionService';

const PAGE_SIZE = 200;

interface LoadedData {
  transactions: StoredTransaction[];
  categories: Category[];
  categoryGroups: CategoryGroup[];
}

export default function RapprochementPage() {
  const [data, setData] = useState<LoadedData | null>(null);
  const [history, setHistory] = useState<LabeledCategory[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyIds, setBusyIds] = useState<ReadonlySet<string>>(new Set());
  const [isAdmin, setIsAdmin] = useState(false);
  const [skipped, setSkipped] = useState<string[]>([]);
  const [hasActed, setHasActed] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const { data: progress, refresh: refreshProgress } = useGamification();
  const wasMonthComplete = useRef<boolean | null>(null);
  const previousLevel = useRef<number | null>(null);
  const [noticeCount, setNoticeCount] = useState(0);
  const [lastPointed, setLastPointed] = useState<StoredTransaction[] | null>(null);
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

    // L'historique ne sert qu'aux suggestions : s'il manque, on pointe simplement sans suggestion.
    getPointedLabelHistory()
      .then((rows) => {
        if (isCurrent) setHistory(rows);
      })
      .catch(() => {});

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

    const { level, title } = progress.levelInfo;
    if (previousLevel.current !== null && level > previousLevel.current && !isComplete) {
      setCelebration(`Niveau ${level} : ${title} ! Tu progresses à ton rythme, continue comme ça.`);
    }
    previousLevel.current = level;
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
    const pointed = data?.transactions.filter((item) => ids.includes(item.id)) ?? [];
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
        setCelebration(null);
        setLastPointed(pointed);
        setNoticeCount((count) => count + 1);
        refreshProgress();
      },
    );
  };

  /** Annule le dernier pointage (une erreur de clic ne doit jamais coûter cher). */
  const undoLastPointing = () => {
    if (!lastPointed || lastPointed.length === 0) return;
    const ids = lastPointed.map((item) => item.id);
    const restored = lastPointed;

    void runAction(
      ids,
      () => unreconcileTransactions(ids),
      () => {
        setData((current) =>
          current && {
            ...current,
            transactions: [...restored, ...current.transactions].sort((a, b) => b.booked_on.localeCompare(a.booked_on)),
          },
        );
        setLastPointed(null);
        setCelebration(null);
        setNotice(`Pointage annulé : ${ids.length} opération${ids.length > 1 ? 's' : ''} de retour dans la liste.`);
        setNoticeCount((count) => count + 1);
        refreshProgress();
      },
    );
  };

  const transactions = data?.transactions ?? [];
  // Les opérations remises à plus tard passent à la fin de la file.
  const queue = [
    ...transactions.filter((item) => !skipped.includes(item.id)),
    ...skipped.flatMap((id) => transactions.filter((item) => item.id === id)),
  ];
  const current = queue[0];
  const readyIds = transactions.filter((item) => item.category_id).map((item) => item.id);
  const month = progress?.currentMonth;

  const quickCategories = (() => {
    if (!data) return [];
    const counts = new Map<string, number>();
    transactions.forEach((item) => {
      if (item.category_id) counts.set(item.category_id, (counts.get(item.category_id) ?? 0) + 1);
    });
    return [...counts.entries()]
      .sort((first, second) => second[1] - first[1])
      .slice(0, 4)
      .flatMap(([id]) => data.categories.filter((category) => category.id === id));
  })();

  // Suggestion seulement tant que la carte n'a pas de catégorie : dès qu'on choisit, elle s'efface.
  const suggestionRaw = current && !current.category_id ? suggestCategory(current.label, history) : undefined;
  const suggestedCategory = suggestionRaw ? data?.categories.find((item) => item.id === suggestionRaw.categoryId) : undefined;
  const suggestion = suggestionRaw && suggestedCategory ? { category: suggestedCategory, kind: suggestionRaw.kind, count: suggestionRaw.count } : undefined;

  const skipCurrent = () => {
    if (!current) return;
    setHasActed(true);
    setSkipped((previous) => [...previous.filter((id) => id !== current.id), current.id]);
  };

  return (
    <ScreenCard
      flow
      title="Pointer" icon="🎯"
      subtitle="Une opération à la fois : choisis la catégorie, puis pointe."
    >
      <div className="mx-auto max-w-2xl space-y-3">
        {month && month.total > 0 && (
          <div className="flex items-center gap-3 rounded-2xl border border-bordure bg-surface px-3 py-1.5">
            <p className="shrink-0 text-sm font-bold text-texte">
              {month.done} / {month.total} pointées
            </p>
            <div className="min-w-0 flex-1">
              <Gauge value={month.done} max={month.total} label="Opérations du mois pointées" valueText={`${month.done} sur ${month.total}`} />
            </div>
            {progress && (
              <p className="hidden shrink-0 text-xs font-semibold text-texte-doux sm:block">
                Niveau {progress.levelInfo.level} · {progress.xp} points
              </p>
            )}
          </div>
        )}

        {celebration && (
          <p role="status" className="motion-safe:animate-[pop_0.6s_ease-out_1] rounded-2xl border-2 border-bordure bg-attention-fond p-3 text-center text-base font-black text-attention">
            <span aria-hidden="true">🎉 </span>
            {celebration}
          </p>
        )}

        {notice && !celebration && (
          <p
            key={noticeCount}
            role="status"
            className="motion-safe:animate-[pop_0.5s_ease-out_1] rounded-2xl border-2 border-bordure bg-ok-fond p-2.5 text-center text-sm font-black text-ok"
          >
            <span aria-hidden="true">✨ </span>
            {notice}
          </p>
        )}

        {lastPointed && lastPointed.length > 0 && (
          <div className="text-center">
            <button
              type="button"
              onClick={undoLastPointing}
              className="min-h-11 rounded-xl border-2 border-bordure bg-surface px-4 text-sm font-bold text-texte transition hover:bg-accent-doux focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              <span aria-hidden="true">↩️ </span>Annuler le dernier pointage
            </button>
          </div>
        )}

        {!data && !loadError && (
          <p className="py-6 text-center text-sm font-semibold text-texte-doux" role="status">
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

        {data && current && (
          <>
            <ReconcileCard
              key={current.id}
              transaction={current}
              categories={data.categories}
              categoryGroups={data.categoryGroups}
              quickCategories={quickCategories}
              suggestion={suggestion}
              remaining={queue.length}
              isBusy={busyIds.has(current.id)}
              canSkip={queue.length > 1}
              focusOnMount={hasActed}
              onChangeCategory={(categoryId) => changeCategory(current, categoryId)}
              onReconcile={() => {
                setHasActed(true);
                reconcile([current.id]);
              }}
              onSkip={skipCurrent}
              onRuleSaved={setNotice}
            />

            {readyIds.length > 1 && (
              <button
                type="button"
                onClick={() => {
                  setHasActed(true);
                  reconcile(readyIds);
                }}
                disabled={readyIds.some((id) => busyIds.has(id))}
                className="min-h-11 w-full rounded-xl border border-bordure-forte bg-white/70 px-4 text-sm font-bold text-texte transition hover:bg-white focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-50"
              >
                Pointer d’un coup les {readyIds.length} déjà catégorisées
              </button>
            )}
          </>
        )}

        {data && !current && (
          <div className="rounded-carte border-[3px] border-dashed border-bordure bg-surface-douce p-6 text-center">
            <p className="text-xl font-black text-texte">Tout est pointé. <span aria-hidden="true">✨</span></p>
            <p className="mt-1 text-sm text-texte-doux">Prochaine étape : regarder où est passé ton argent ce mois-ci.</p>
            <div className="mt-4 flex flex-col justify-center gap-2 sm:flex-row">
              <Link
                href={ROUTES.actualExpenses}
                className="inline-flex min-h-12 items-center justify-center rounded-carte border-[3px] border-bordure bg-accent px-5 py-2 font-bold text-sur-accent shadow-bonbon transition-transform hover:translate-y-[2px]"
              >
                Voir mon bilan →
              </Link>
              <Link
                href={ROUTES.import}
                className="inline-flex min-h-12 items-center justify-center rounded-carte border-2 border-bordure-forte bg-white/70 px-5 py-2 font-bold text-texte"
              >
                Importer un autre relevé
              </Link>
            </div>
          </div>
        )}

        {data && isAdmin && (
          <details className="rounded-2xl border border-dashed border-bordure bg-surface-douce px-3 py-1">
            <summary className="flex min-h-11 cursor-pointer items-center text-sm font-bold text-texte">
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
      </div>
    </ScreenCard>
  );
}
