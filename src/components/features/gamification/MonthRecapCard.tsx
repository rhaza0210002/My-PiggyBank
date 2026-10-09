"use client";

import { useEffect, useId, useState } from "react";
import { revealAmount } from "@/components/ui/BalanceToggle";
import { MONTHS } from "@/constants/tableStyles";
import { getBudgetEntries } from "@/services/budgetService";
import { getCategories } from "@/services/transactionCategoryService";
import { getTransactionsForMonth } from "@/services/transactionService";
import { euroFormatter } from "@/utils/formatEuro";
import { buildMonthRecap, type MonthRecap } from "@/utils/monthRecap";

interface MonthRecapCardProps {
  year: number;
  monthIndex: number;
  /** Les montants suivent le bouton « œil » du tableau de bord. */
  isAmountShown: boolean;
}

/** Bilan d'un mois bouclé : ce qui a tenu en premier, ce qui est à regarder ensuite, sans reproche. */
export default function MonthRecapCard({
  year,
  monthIndex,
  isAmountShown,
}: MonthRecapCardProps) {
  const [recap, setRecap] = useState<MonthRecap | null>(null);

  useEffect(() => {
    let isCurrent = true;

    Promise.all([
      getTransactionsForMonth(year, monthIndex),
      getBudgetEntries(year),
      getCategories(),
    ])
      .then(([transactions, entries, categories]) => {
        if (isCurrent)
          setRecap(
            buildMonthRecap(transactions, entries, categories, monthIndex),
          );
      })
      .catch(() => {});

    return () => {
      isCurrent = false;
    };
  }, [year, monthIndex]);

  if (!recap || recap.operations === 0) return null;

  return (
    <MonthRecapView
      recap={recap}
      monthIndex={monthIndex}
      isAmountShown={isAmountShown}
    />
  );
}

interface MonthRecapViewProps {
  recap: MonthRecap;
  monthIndex: number;
  isAmountShown: boolean;
}

/** Le bilan lui-même : la liste reste repliée tant que la personne ne la déroule pas. */
export function MonthRecapView({
  recap,
  monthIndex,
  isAmountShown,
}: MonthRecapViewProps) {
  const listId = useId();
  const [isOpen, setIsOpen] = useState(false);

  const monthName = MONTHS[monthIndex].label.toLowerCase();
  const ofMonth = /^[aeiouéèh]/.test(monthName)
    ? `d’${monthName}`
    : `de ${monthName}`;
  const money = (value: number) =>
    revealAmount(isAmountShown, euroFormatter.format(value));

  return (
    <section
      aria-labelledby="recap-title"
      className="carte-vivante shrink-0 rotate-[0.4deg] rounded-carte border-2 border-texte bg-attention-fond p-4 shadow-sticker sm:p-5"
    >
      <h2
        id="recap-title"
        className="text-2xl font-extrabold leading-none text-texte"
      >
        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          aria-expanded={isOpen}
          aria-controls={listId}
          className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl text-left focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          <span>
            <span aria-hidden="true">🎉 </span>Ton bilan {ofMonth}
          </span>
          <span
            aria-hidden="true"
            className={`shrink-0 text-xl transition-transform motion-reduce:transition-none ${isOpen ? "rotate-180" : ""}`}
          >
            ▾
          </span>
        </button>
      </h2>
      {isOpen && (
        <ul
          id={listId}
          className="mt-2 space-y-1.5 text-sm font-semibold text-texte [&>li]:border-b-2 [&>li]:border-dotted [&>li]:border-corail [&>li]:pb-1.5 [&>li:last-child]:border-0"
        >
          <li>
            <strong>{recap.operations}</strong> opération
            {recap.operations > 1 ? "s" : ""} pointée
            {recap.operations > 1 ? "s" : ""}, bravo.
          </li>
          {recap.budgetedCount > 0 && (
            <li>
              <strong>{recap.withinBudgetCount}</strong> catégorie
              {recap.withinBudgetCount > 1 ? "s" : ""} sur {recap.budgetedCount}{" "}
              restée{recap.withinBudgetCount > 1 ? "s" : ""} dans le budget.
            </li>
          )}
          {recap.topCategory && (
            <li>
              Plus grosse dépense : {recap.topCategory.label} (
              {money(recap.topCategory.spent)}).
            </li>
          )}
          {recap.overBudget.length > 0 && (
            <li className="text-attention">
              À regarder doucement :{" "}
              {recap.overBudget.map((item) => item.label).join(", ")}. Un budget
              se réajuste, rien de grave.
            </li>
          )}
        </ul>
      )}
    </section>
  );
}
