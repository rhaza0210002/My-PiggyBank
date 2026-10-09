"use client";

import Button from '@/components/ui/Button';
import { useEffect, useRef, useState } from 'react';
import LabelRuleForm from '@/components/features/forms/LabelRuleForm';
import { MONTHS } from '@/constants/tableStyles';
import type { Category, CategoryGroup } from '@/services/transactionCategoryService';
import type { StoredTransaction } from '@/services/transactionService';
import { signedEuroFormatter } from '@/utils/formatEuro';

interface ReconcileCardProps {
  transaction: StoredTransaction;
  categories: Category[];
  categoryGroups: CategoryGroup[];
  /** Catégories les plus utilisées parmi les opérations à pointer : un seul geste pour les choisir. */
  quickCategories: Category[];
  /** Catégorie probable d'après les libellés déjà pointés ; absente quand rien ne permet de deviner. */
  suggestion?: { category: Category; kind: 'exact' | 'similar'; count: number };
  remaining: number;
  isBusy: boolean;
  canSkip: boolean;
  /** Replace le focus sur la carte quand une nouvelle opération arrive (lecteurs d'écran, clavier). */
  focusOnMount: boolean;
  onChangeCategory: (categoryId: string) => void;
  onReconcile: () => void;
  onSkip: () => void;
  onRuleSaved: (message: string) => void;
}

function formatDate(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

/** Une opération à la fois : on lit, on choisit une catégorie, on pointe. */
export default function ReconcileCard({
  transaction,
  categories,
  categoryGroups,
  quickCategories,
  suggestion,
  remaining,
  isBusy,
  canSkip,
  focusOnMount,
  onChangeCategory,
  onReconcile,
  onSkip,
  onRuleSaved,
}: ReconcileCardProps) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [isRuleOpen, setIsRuleOpen] = useState(false);
  const amount = Number(transaction.amount);
  const category = categories.find((item) => item.id === transaction.category_id);
  const monthLabel = MONTHS[Number(transaction.booked_on.slice(5, 7)) - 1]?.label;

  useEffect(() => {
    if (focusOnMount) titleRef.current?.focus();
  }, [focusOnMount]);

  return (
    <article
      aria-labelledby="reconcile-title"
      className="space-y-2.5 rounded-carte border-[3px] border-bordure bg-surface p-3 shadow-bonbon motion-safe:animate-[pop_0.35s_ease-out_1] sm:p-4"
    >
      <div className="flex flex-col items-center gap-1 text-center">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-texte-doux">
            Il en reste {remaining} · <span className="capitalize">{formatDate(transaction.booked_on)}</span>
            {monthLabel && <span className="sr-only"> ({monthLabel})</span>}
          </p>
          <h2
            id="reconcile-title"
            ref={titleRef}
            tabIndex={-1}
            className="mt-0.5 break-words text-xl font-black leading-tight text-texte outline-none [overflow-wrap:anywhere] sm:text-2xl"
          >
            {transaction.label}
          </h2>
        </div>
        <p className={`shrink-0 rounded-full px-4 py-0.5 text-2xl font-black sm:text-3xl ${amount < 0 ? 'bg-surface-douce text-depasse' : 'bg-ok-fond text-ok'}`}>
          {signedEuroFormatter.format(amount)}
        </p>
      </div>

      {suggestion && (
        <div className="text-center">
          <button
            type="button"
            disabled={isBusy}
            onClick={() => onChangeCategory(suggestion.category.id)}
            className="min-h-12 rounded-2xl border-[3px] border-accent-fort bg-surface px-4 text-base font-black text-depasse shadow-bonbon transition-transform hover:translate-y-[1px] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-50"
          >
            <span aria-hidden="true">✨ </span>
            {suggestion.category.label}
          </button>
          <p className="mt-1 text-xs font-semibold text-texte-doux">
            {suggestion.kind === 'exact'
              ? `Suggestion : déjà rangé là ${suggestion.count} fois`
              : 'Suggestion : ressemble à tes pointages passés'}
          </p>
        </div>
      )}

      {quickCategories.length > 0 && (
        <div role="group" aria-label="Catégories fréquentes" className="flex flex-wrap justify-center gap-1.5">
          {quickCategories.map((item) => (
            <button
              key={item.id}
              type="button"
              disabled={isBusy}
              aria-pressed={item.id === transaction.category_id}
              onClick={() => onChangeCategory(item.id)}
              className="min-h-11 rounded-full border-2 border-bordure bg-white px-3 text-sm font-semibold text-texte transition-colors hover:bg-accent-doux focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-50 aria-pressed:border-accent-fort aria-pressed:bg-accent-doux aria-pressed:font-bold aria-pressed:text-accent-fort"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      <div>
        <label htmlFor="reconcile-category" className="block text-center text-sm font-bold text-texte">
          Catégorie
          {category && <span className="ml-2 font-semibold text-ok">✓ choisie</span>}
        </label>
        <select
          id="reconcile-category"
          value={transaction.category_id ?? ''}
          disabled={isBusy}
          onChange={(event) => onChangeCategory(event.target.value)}
          className="mt-1 min-h-12 w-full rounded-xl border-2 border-bordure-forte bg-white px-3 text-center text-base text-texte disabled:opacity-50"
        >
          <option value="">— Choisir une catégorie —</option>
          {categoryGroups.map((group) => {
            const groupCategories = categories.filter((item) => item.cat_group_key === group.id);
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
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          onClick={onReconcile}
          disabled={isBusy || !transaction.category_id}
          className="min-h-14 flex-1 text-lg"
        >
          {transaction.category_id ? 'Pointer ✓' : 'Choisis une catégorie'}
        </Button>
        {canSkip && (
          <button
            type="button"
            onClick={onSkip}
            disabled={isBusy}
            className="min-h-14 rounded-carte border-2 border-bordure-forte bg-white/70 px-5 font-bold text-texte transition hover:bg-white focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-50"
          >
            Plus tard
          </button>
        )}
      </div>

      {category &&
        (isRuleOpen ? (
          <LabelRuleForm
            transactionLabel={transaction.label}
            category={category}
            onCancel={() => setIsRuleOpen(false)}
            onSaved={(message) => {
              setIsRuleOpen(false);
              onRuleSaved(message);
            }}
          />
        ) : (
          <button
            type="button"
            onClick={() => setIsRuleOpen(true)}
            className="mx-auto flex min-h-11 items-center rounded-lg px-1 text-center text-sm font-bold text-accent-fort underline underline-offset-2 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            Retenir ce libellé pour les prochains imports
          </button>
        ))}
    </article>
  );
}
