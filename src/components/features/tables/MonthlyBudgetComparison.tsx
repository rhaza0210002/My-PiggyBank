"use client";

import { startTransition, useEffect, useState } from 'react';
import BalanceToggle, { revealAmount, useBalanceVisibility } from '@/components/ui/BalanceToggle';
import { MONTHS, TABLE_STYLES } from '@/constants/tableStyles';
import { getBudgetGroupPalette } from '@/constants/budgetGroupPalette';
import { getBudgetEntries } from '@/services/budgetService';
import {
  getCategories,
  getCategoriesGroupKey,
  type Category,
  type CategoryGroup,
} from '@/services/transactionCategoryService';
import { formatCurrency } from '@/utils/budgetCalculations';
import { getDifference, isIncomeGroup } from '@/utils/budgetComparison';

/** Montant réel cumulé d'une catégorie, quelle que soit l'origine des transactions. */
export interface ComparisonGroup {
  categoryId: string | null;
  totalAmount: number;
  records: readonly unknown[];
}

interface MonthlyBudgetComparisonProps {
  groups: ComparisonGroup[];
  /** Si renseignés, le mois et l'année sont pilotés par le parent et le sélecteur de mois est masqué. */
  monthIndex?: number;
  year?: number;
}

interface BudgetComparisonRow {
  categoryId: string;
  label: string;
  budget: number;
  actual: number;
}

interface BudgetComparisonGroup {
  id: number;
  key: string;
  title: string;
  isIncome: boolean;
  rows: BudgetComparisonRow[];
}

interface LoadedBudgetEntry {
  category_id: string;
  month_index: number;
  amount: number;
  year: number;
}

export default function MonthlyBudgetComparison({
  groups,
  monthIndex: controlledMonthIndex,
  year: controlledYear,
}: MonthlyBudgetComparisonProps) {
  const balance = useBalanceVisibility();
  const [internalYear, setInternalYear] = useState<number | null>(null);
  const [internalMonthIndex, setInternalMonthIndex] = useState(0);
  const currentYear = controlledYear ?? internalYear;
  const monthIndex = controlledMonthIndex ?? internalMonthIndex;
  const isMonthControlled = controlledMonthIndex !== undefined;
  const [budgetEntries, setBudgetEntries] = useState<LoadedBudgetEntry[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryGroups, setCategoryGroups] = useState<CategoryGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const now = new Date();
    startTransition(() => {
      setInternalYear(now.getFullYear());
      setInternalMonthIndex(now.getMonth());
    });
  }, []);

  useEffect(() => {
    if (currentYear === null) return;

    let isCurrent = true;

    Promise.all([getBudgetEntries(currentYear), getCategories(), getCategoriesGroupKey()])
      .then(([entries, loadedCategories, loadedCategoryGroups]) => {
        if (!isCurrent) return;
        setBudgetEntries(entries.map((entry) => ({ ...entry, year: currentYear })));
        setCategories(loadedCategories);
        setCategoryGroups(loadedCategoryGroups);
        setError(null);
      })
      .catch((loadError: unknown) => {
        if (!isCurrent) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Impossible de charger le budget mensuel.',
        );
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [currentYear]);

  if (currentYear === null) {
    return (
      <section className="space-y-4" aria-labelledby="monthly-comparison-title">
        <h3 id="monthly-comparison-title" className="text-lg font-black text-texte">
          Comparaison budget / réel
        </h3>
        <p className="py-6 text-center text-sm font-semibold text-texte-doux">Chargement...</p>
      </section>
    );
  }

  const budgetByCategoryId = new Map<string, number>();
  budgetEntries
    .filter((entry) => entry.month_index === monthIndex)
    .forEach((entry) => {
      budgetByCategoryId.set(
        entry.category_id,
        (budgetByCategoryId.get(entry.category_id) ?? 0) + Number(entry.amount || 0),
      );
    });

  const actualByCategoryId = new Map<string, number>();
  let categorizedTransactionCount = 0;
  let transactionCount = 0;

  groups.forEach((group) => {
    transactionCount += group.records.length;
    if (!group.categoryId) return;

    categorizedTransactionCount += group.records.length;
    actualByCategoryId.set(
      group.categoryId,
      (actualByCategoryId.get(group.categoryId) ?? 0) + group.totalAmount,
    );
  });

  const categoriesByGroupId = new Map<number, Category[]>();
  categories.forEach((category) => {
    const groupCategories = categoriesByGroupId.get(category.cat_group_key) ?? [];
    groupCategories.push(category);
    categoriesByGroupId.set(category.cat_group_key, groupCategories);
  });

  const comparisonGroups: BudgetComparisonGroup[] = categoryGroups
    .map((group) => {
      const rows = (categoriesByGroupId.get(group.id) ?? [])
        .map((category) => ({
          categoryId: category.id,
          label: category.label,
          budget: budgetByCategoryId.get(category.id) ?? 0,
          actual: actualByCategoryId.get(category.id) ?? 0,
        }))
        .filter((row) => row.budget !== 0 || row.actual !== 0)
        .sort((first, second) => second.actual - first.actual || first.label.localeCompare(second.label, 'fr'));

      return {
        id: group.id,
        key: group.label || String(group.id),
        title: group.libelle,
        isIncome: isIncomeGroup(group),
        rows,
      };
    });

  // Solde prévu / réel : revenus moins dépenses (le réel des dépenses est déjà négatif).
  const totalBudget = comparisonGroups.reduce(
    (groupTotal, group) =>
      groupTotal + group.rows.reduce((sum, row) => sum + (group.isIncome ? row.budget : -row.budget), 0),
    0,
  );
  const totalActual = comparisonGroups.reduce(
    (groupTotal, group) => groupTotal + group.rows.reduce((sum, row) => sum + row.actual, 0),
    0,
  );
  const totalDifference = comparisonGroups.reduce(
    (groupTotal, group) =>
      groupTotal + group.rows.reduce((sum, row) => sum + getDifference(group.isIncome, row.budget, row.actual), 0),
    0,
  );
  // Tant que le solde est caché, la couleur de fond ne doit pas non plus laisser deviner son signe.
  const shownDifference = balance.isShown ? totalDifference : 0;
  const uncategorizedGroup = groups.find((group) => group.categoryId === null);
  return (
    <section className="space-y-4" aria-labelledby="monthly-comparison-title">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 id="monthly-comparison-title" className="text-lg font-black text-texte">
            Comparaison budget / réel
          </h3>
          <p className="text-sm text-texte-doux">
            {isMonthControlled
              ? 'Le réel reprend les transactions enregistrées pour ce mois.'
              : 'Le réel reprend le cumul par catégorie affiché dans la liste des transactions importées.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {!isMonthControlled && (
          <label className="flex items-center gap-2 text-sm font-semibold text-texte">
            Mois
            <select
              value={monthIndex}
              onChange={(event) => setInternalMonthIndex(Number(event.target.value))}
              className="rounded-lg border border-bordure bg-white px-3 py-2"
            >
              {MONTHS.map((month, index) => (
                <option key={month.key} value={index}>{month.label}</option>
              ))}
            </select>
          </label>
          )}
        </div>
      </div>
      <p className="text-xs text-texte-doux">
        Budget {MONTHS[monthIndex].label} {currentYear} comparé au réel {isMonthControlled ? 'enregistré' : 'du fichier CSV importé'}.
      </p>

      {isLoading ? (
        <p className="py-6 text-center text-sm font-semibold text-texte-doux">Chargement du budget…</p>
      ) : error ? (
        <p className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm font-semibold text-red-800" role="alert">
          {error}
        </p>
      ) : (
        <div className="space-y-5">
          {comparisonGroups.map((group) => {
            const palette = getBudgetGroupPalette(group.key, group.title);
            const groupBudget = group.rows.reduce((sum, row) => sum + row.budget, 0);
            const groupActual = group.rows.reduce((sum, row) => sum + row.actual, 0);
            const groupDifference = group.rows.reduce(
              (sum, row) => sum + getDifference(group.isIncome, row.budget, row.actual),
              0,
            );

            return (
              <section
                key={group.id}
                className={`overflow-hidden rounded-xl border ${palette.border} ${palette.section}`}
                aria-label={`Comparaison pour ${group.title}`}
              >
                <h4 className={`px-4 py-3 font-black text-texte ${palette.header}`}>
                  {group.title}
                </h4>
                <div className="space-y-2 p-2 md:hidden">
                  {group.rows.length === 0 ? (
                    <p className="rounded-lg bg-white/55 p-3 text-center text-sm italic text-texte-doux">
                      Aucune donnée pour {MONTHS[monthIndex].label}.
                    </p>
                  ) : group.rows.map((row) => {
                    const difference = getDifference(group.isIncome, row.budget, row.actual);
                    return (
                      <article key={row.categoryId} className={`min-w-0 rounded-lg border ${palette.border} ${palette.table} p-3`}>
                        <h5 className="mb-2 break-words text-sm font-bold text-texte">
                          {row.label}
                        </h5>
                        <dl className="grid grid-cols-3 gap-2">
                          <div className="min-w-0">
                            <dt className="text-[0.65rem] font-semibold uppercase text-texte-doux">Budget</dt>
                            <dd className="break-words text-sm font-bold text-texte">{formatCurrency(row.budget)}</dd>
                          </div>
                          <div className="min-w-0">
                            <dt className="text-[0.65rem] font-semibold uppercase text-texte-doux">Réel</dt>
                            <dd className="break-words text-sm font-bold text-texte">{formatCurrency(row.actual)}</dd>
                          </div>
                          <div className="min-w-0">
                            <dt className="text-[0.65rem] font-semibold uppercase text-texte-doux">Écart</dt>
                            <dd className={`break-words text-sm font-black ${difference < 0 ? 'text-red-700' : 'text-green-800'}`}>
                              {formatCurrency(difference)}
                            </dd>
                          </div>
                        </dl>
                      </article>
                    );
                  })}
                  <article className={`rounded-lg border ${palette.border} ${palette.header} p-3`}>
                    <h5 className="mb-2 break-words text-sm font-black text-texte">
                      Sous-total {group.title}
                    </h5>
                    <dl className="grid grid-cols-3 gap-2">
                      <div className="min-w-0">
                        <dt className="text-[0.65rem] font-semibold uppercase text-texte-doux">Budget</dt>
                        <dd className="break-words text-sm font-black">{formatCurrency(groupBudget)}</dd>
                      </div>
                      <div className="min-w-0">
                        <dt className="text-[0.65rem] font-semibold uppercase text-texte-doux">Réel</dt>
                        <dd className="break-words text-sm font-black">{formatCurrency(groupActual)}</dd>
                      </div>
                      <div className="min-w-0">
                        <dt className="text-[0.65rem] font-semibold uppercase text-texte-doux">Écart</dt>
                        <dd className={`break-words text-sm font-black ${groupDifference < 0 ? 'text-red-700' : 'text-green-800'}`}>
                          {formatCurrency(groupDifference)}
                        </dd>
                      </div>
                    </dl>
                  </article>
                </div>

                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[620px] border-collapse text-left">
                    <thead>
                      <tr className={`${palette.header} text-texte`}>
                        <th scope="col" className={TABLE_STYLES.thCategory}>Catégorie</th>
                        <th scope="col" className={TABLE_STYLES.thAmount}>Budget</th>
                        <th scope="col" className={TABLE_STYLES.thAmount}>Réel</th>
                        <th scope="col" className={TABLE_STYLES.thAmount}>Écart</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.rows.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-5 text-center text-sm italic text-texte-doux">
                            Aucune donnée pour ce groupe en {MONTHS[monthIndex].label}.
                          </td>
                        </tr>
                      ) : group.rows.map((row, index) => {
                        const difference = getDifference(group.isIncome, row.budget, row.actual);
                        return (
                          <tr key={row.categoryId} className={index % 2 === 0 ? palette.rowEven : palette.rowOdd}>
                            <td className={TABLE_STYLES.cellCategory}>{row.label}</td>
                            <td className={TABLE_STYLES.cellAmount}>{formatCurrency(row.budget)}</td>
                            <td className={TABLE_STYLES.cellAmount}>{formatCurrency(row.actual)}</td>
                            <td className={`${TABLE_STYLES.cellAmount} font-bold ${difference < 0 ? 'text-red-700' : 'text-green-800'}`}>
                              {formatCurrency(difference)}
                            </td>
                          </tr>
                        );
                      })}
                      <tr className={`${palette.header} font-black`}>
                        <td className={TABLE_STYLES.cellCategory}>Sous-total {group.title}</td>
                        <td className={TABLE_STYLES.cellAmount}>{formatCurrency(groupBudget)}</td>
                        <td className={TABLE_STYLES.cellAmount}>{formatCurrency(groupActual)}</td>
                        <td className={`${TABLE_STYLES.cellAmount} ${groupDifference < 0 ? 'text-red-700' : 'text-green-800'}`}>
                          {formatCurrency(groupDifference)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            );
          })}

          <div className={`rounded-xl border p-3 md:hidden ${shownDifference > 0 ? 'border-bordure bg-ok-fond' : shownDifference < 0 ? 'border-accent bg-surface-douce' : 'border-bordure-forte bg-surface-douce'}`}>
            <div className="mb-2 flex items-center justify-between gap-2">
              <h4 className="text-sm font-black text-texte">Solde général (revenus − dépenses)</h4>
              <BalanceToggle isShown={balance.isShown} onToggle={balance.toggle} subject="le solde général" />
            </div>
            <dl className="grid grid-cols-3 gap-2">
              <div className="min-w-0">
                <dt className="text-[0.65rem] font-semibold uppercase text-texte-doux">Budget</dt>
                <dd className="break-words text-sm font-black">{revealAmount(balance.isShown, formatCurrency(totalBudget))}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-[0.65rem] font-semibold uppercase text-texte-doux">Réel</dt>
                <dd className="break-words text-sm font-black">{revealAmount(balance.isShown, formatCurrency(totalActual))}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-[0.65rem] font-semibold uppercase text-texte-doux">Écart</dt>
                <dd className={`break-words text-sm font-black ${balance.isShown && totalDifference < 0 ? 'text-red-700' : 'text-green-800'}`}>
                  {revealAmount(balance.isShown, formatCurrency(totalDifference))}
                </dd>
              </div>
            </dl>
          </div>

          <div className={`hidden overflow-x-auto rounded-xl border md:block ${shownDifference > 0 ? 'border-bordure bg-ok-fond' : shownDifference < 0 ? 'border-accent bg-surface-douce' : 'border-bordure-forte bg-surface-douce'}`}>
            <table className="w-full min-w-[620px] border-collapse text-left" aria-label="Solde général de la comparaison">
              <tbody>
                <tr className={`font-black ${shownDifference > 0 ? 'bg-ok-fond' : shownDifference < 0 ? 'bg-surface-douce' : 'bg-surface-douce'}`}>
                  <td className={TABLE_STYLES.cellCategory}>
                    <span className="flex items-center gap-2">
                      <BalanceToggle isShown={balance.isShown} onToggle={balance.toggle} subject="le solde général" />
                      Solde général (revenus − dépenses)
                    </span>
                  </td>
                  <td className={TABLE_STYLES.cellAmount}>{revealAmount(balance.isShown, formatCurrency(totalBudget))}</td>
                  <td className={TABLE_STYLES.cellAmount}>{revealAmount(balance.isShown, formatCurrency(totalActual))}</td>
                  <td className={`${TABLE_STYLES.cellAmount} ${balance.isShown && totalDifference < 0 ? 'text-red-700' : 'text-green-800'}`}>
                    {revealAmount(balance.isShown, formatCurrency(totalDifference))}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {uncategorizedGroup && uncategorizedGroup.records.length > 0 && (
        <p className="text-xs font-semibold text-attention">
          {uncategorizedGroup.records.length} opération{uncategorizedGroup.records.length > 1 ? 's' : ''} sans catégorie
          ({formatCurrency(uncategorizedGroup.totalAmount)}) ne figure{uncategorizedGroup.records.length > 1 ? 'nt' : ''} pas
          dans ce tableau : catégorise-les dans le rapprochement.
        </p>
      )}

      {categorizedTransactionCount === 0 && transactionCount > 0 && (
        <p className="text-xs text-texte-doux">
          Aucune transaction catégorisée dans le fichier importé.
        </p>
      )}
    </section>
  );
}