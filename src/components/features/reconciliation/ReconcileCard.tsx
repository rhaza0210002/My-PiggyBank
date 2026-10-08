"use client";

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
      className="space-y-2.5 rounded-[1.6rem] border-[3px] border-[#d7b59d] bg-[#fff8f2] p-3 shadow-[0_4px_0_rgba(140,103,86,0.14)] motion-safe:animate-[pop_0.35s_ease-out_1] sm:p-4"
    >
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#6b574c]">
            Il en reste {remaining} · <span className="capitalize">{formatDate(transaction.booked_on)}</span>
            {monthLabel && <span className="sr-only"> ({monthLabel})</span>}
          </p>
          <h2
            id="reconcile-title"
            ref={titleRef}
            tabIndex={-1}
            className="mt-0.5 break-words text-xl font-black leading-tight text-[#5d4d44] outline-none [overflow-wrap:anywhere] sm:text-2xl"
          >
            {transaction.label}
          </h2>
        </div>
        <p className={`shrink-0 text-2xl font-black sm:text-3xl ${amount < 0 ? 'text-[#9c3633]' : 'text-[#2f5d32]'}`}>
          {signedEuroFormatter.format(amount)}
        </p>
      </div>

      {quickCategories.length > 0 && (
        <div role="group" aria-label="Catégories fréquentes" className="flex flex-wrap gap-1.5">
          {quickCategories.map((item) => (
            <button
              key={item.id}
              type="button"
              disabled={isBusy}
              aria-pressed={item.id === transaction.category_id}
              onClick={() => onChangeCategory(item.id)}
              className="min-h-11 rounded-full border-2 border-[#d8b7a5] bg-white px-3 text-sm font-semibold text-[#5a4d41] transition-colors hover:bg-[#F8D5CB] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#5b473d] disabled:opacity-50 aria-pressed:border-[#a3452a] aria-pressed:bg-[#F8D5CB] aria-pressed:font-bold aria-pressed:text-[#7a2f1a]"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      <div>
        <label htmlFor="reconcile-category" className="block text-sm font-bold text-[#5d4d44]">
          Catégorie
          {category && <span className="ml-2 font-semibold text-[#2f5d32]">✓ choisie</span>}
        </label>
        <select
          id="reconcile-category"
          value={transaction.category_id ?? ''}
          disabled={isBusy}
          onChange={(event) => onChangeCategory(event.target.value)}
          className="mt-1 min-h-12 w-full rounded-xl border-2 border-[#9c7560] bg-white px-3 text-base text-[#5d4d44] disabled:opacity-50"
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
        <button
          type="button"
          onClick={onReconcile}
          disabled={isBusy || !transaction.category_id}
          className="min-h-14 flex-1 rounded-[1.25rem] border-[3px] border-[#e4a58f] bg-[#e59a86] px-5 text-lg font-black text-[#3d2a21] shadow-[0_4px_0_rgba(171,98,77,0.85)] transition-all hover:translate-y-[2px] hover:shadow-[0_2px_0_rgba(171,98,77,0.85)] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#5b473d] disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none"
        >
          {transaction.category_id ? 'Pointer ✓' : 'Choisis une catégorie'}
        </button>
        {canSkip && (
          <button
            type="button"
            onClick={onSkip}
            disabled={isBusy}
            className="min-h-14 rounded-[1.25rem] border-2 border-[#b88f78] bg-white/70 px-5 font-bold text-[#5d4d44] transition hover:bg-white focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#5b473d] disabled:opacity-50"
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
            className="min-h-11 rounded-lg px-1 text-sm font-bold text-[#8c4a38] underline underline-offset-2 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#5b473d]"
          >
            Retenir ce libellé pour les prochains imports
          </button>
        ))}
    </article>
  );
}
