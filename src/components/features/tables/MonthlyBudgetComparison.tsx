"use client";

import { startTransition, useEffect, useState } from 'react';
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

/** Les budgets sont saisis en positif ; seul le groupe « Revenus » correspond à des entrées d'argent. */
function isIncomeGroup(group: CategoryGroup): boolean {
  return `${group.label} ${group.libelle}`.toLowerCase().includes('revenu');
}

/** Écart favorable = positif : plus de revenus que prévu, ou moins de dépenses que prévu. */
function getDifference(isIncome: boolean, budget: number, actual: number): number {
  return isIncome ? actual - budget : budget - Math.abs(actual);
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
        <h3 id="monthly-comparison-title" className="text-lg font-black text-[#5d4d44]">
          Comparaison budget / réel
        </h3>
        <p className="py-6 text-center text-sm font-semibold text-[#766356]">Chargement...</p>
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
  const uncategorizedGroup = groups.find((group) => group.categoryId === null);
  return (
    <section className="space-y-4" aria-labelledby="monthly-comparison-title">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 id="monthly-comparison-title" className="text-lg font-black text-[#5d4d44]">
            Comparaison budget / réel
          </h3>
          <p className="text-sm text-[#766356]">
            {isMonthControlled
              ? 'Le réel reprend les transactions enregistrées pour ce mois.'
              : 'Le réel reprend le cumul par catégorie affiché dans la liste des transactions importées.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {!isMonthControlled && (
          <label className="flex items-center gap-2 text-sm font-semibold text-[#5d4d44]">
            Mois
            <select
              value={monthIndex}
              onChange={(event) => setInternalMonthIndex(Number(event.target.value))}
              className="rounded-lg border border-[#d8b7a5] bg-white px-3 py-2"
            >
              {MONTHS.map((month, index) => (
                <option key={month.key} value={index}>{month.label}</option>
              ))}
            </select>
          </label>
          )}
        </div>
      </div>
      <p className="text-xs text-[#766356]">
        Budget {MONTHS[monthIndex].label} {currentYear} comparé au réel {isMonthControlled ? 'enregistré' : 'du fichier CSV importé'}.
      </p>

      {isLoading ? (
        <p className="py-6 text-center text-sm font-semibold text-[#766356]">Chargement du budget…</p>
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
                <h4 className={`px-4 py-3 font-black text-[#5d4d44] ${palette.header}`}>
                  {group.title}
                </h4>
                <div className="space-y-2 p-2 md:hidden">
                  {group.rows.length === 0 ? (
                    <p className="rounded-lg bg-white/55 p-3 text-center text-sm italic text-[#766356]">
                      Aucune donnée pour {MONTHS[monthIndex].label}.
                    </p>
                  ) : group.rows.map((row) => {
                    const difference = getDifference(group.isIncome, row.budget, row.actual);
                    return (
                      <article key={row.categoryId} className={`min-w-0 rounded-lg border ${palette.border} ${palette.table} p-3`}>
                        <h5 className="mb-2 break-words text-sm font-bold text-[#5d4d44]">
                          {row.label}
                        </h5>
                        <dl className="grid grid-cols-3 gap-2">
                          <div className="min-w-0">
                            <dt className="text-[0.65rem] font-semibold uppercase text-[#766356]">Budget</dt>
                            <dd className="break-words text-sm font-bold text-[#5a473d]">{formatCurrency(row.budget)}</dd>
                          </div>
                          <div className="min-w-0">
                            <dt className="text-[0.65rem] font-semibold uppercase text-[#766356]">Réel</dt>
                            <dd className="break-words text-sm font-bold text-[#5a473d]">{formatCurrency(row.actual)}</dd>
                          </div>
                          <div className="min-w-0">
                            <dt className="text-[0.65rem] font-semibold uppercase text-[#766356]">Écart</dt>
                            <dd className={`break-words text-sm font-black ${difference < 0 ? 'text-red-700' : 'text-green-800'}`}>
                              {formatCurrency(difference)}
                            </dd>
                          </div>
                        </dl>
                      </article>
                    );
                  })}
                  <article className={`rounded-lg border ${palette.border} ${palette.header} p-3`}>
                    <h5 className="mb-2 break-words text-sm font-black text-[#5d4d44]">
                      Sous-total {group.title}
                    </h5>
                    <dl className="grid grid-cols-3 gap-2">
                      <div className="min-w-0">
                        <dt className="text-[0.65rem] font-semibold uppercase text-[#766356]">Budget</dt>
                        <dd className="break-words text-sm font-black">{formatCurrency(groupBudget)}</dd>
                      </div>
                      <div className="min-w-0">
                        <dt className="text-[0.65rem] font-semibold uppercase text-[#766356]">Réel</dt>
                        <dd className="break-words text-sm font-black">{formatCurrency(groupActual)}</dd>
                      </div>
                      <div className="min-w-0">
                        <dt className="text-[0.65rem] font-semibold uppercase text-[#766356]">Écart</dt>
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
                      <tr className={`${palette.header} text-[#5a473d]`}>
                        <th scope="col" className={TABLE_STYLES.thCategory}>Catégorie</th>
                        <th scope="col" className={TABLE_STYLES.thAmount}>Budget</th>
                        <th scope="col" className={TABLE_STYLES.thAmount}>Réel</th>
                        <th scope="col" className={TABLE_STYLES.thAmount}>Écart</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.rows.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-5 text-center text-sm italic text-[#766356]">
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

          <div className={`rounded-xl border p-3 md:hidden ${totalDifference > 0 ? 'border-[#83b5a6] bg-[#d2e9df]' : totalDifference < 0 ? 'border-[#d8846d] bg-[#f8e5da]' : 'border-[#b88f78] bg-[#efe0d6]'}`}>
            <h4 className="mb-2 text-sm font-black text-[#5d4d44]">Solde général (revenus − dépenses)</h4>
            <dl className="grid grid-cols-3 gap-2">
              <div className="min-w-0">
                <dt className="text-[0.65rem] font-semibold uppercase text-[#766356]">Budget</dt>
                <dd className="break-words text-sm font-black">{formatCurrency(totalBudget)}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-[0.65rem] font-semibold uppercase text-[#766356]">Réel</dt>
                <dd className="break-words text-sm font-black">{formatCurrency(totalActual)}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-[0.65rem] font-semibold uppercase text-[#766356]">Écart</dt>
                <dd className={`break-words text-sm font-black ${totalDifference < 0 ? 'text-red-700' : 'text-green-800'}`}>
                  {formatCurrency(totalDifference)}
                </dd>
              </div>
            </dl>
          </div>

          <div className={`hidden overflow-x-auto rounded-xl border md:block ${totalDifference > 0 ? 'border-[#83b5a6] bg-[#d2e9df]' : totalDifference < 0 ? 'border-[#d8846d] bg-[#f8e5da]' : 'border-[#b88f78] bg-[#efe0d6]'}`}>
            <table className="w-full min-w-[620px] border-collapse text-left" aria-label="Solde général de la comparaison">
              <tbody>
                <tr className={`font-black ${totalDifference > 0 ? 'bg-[#d2e9df]' : totalDifference < 0 ? 'bg-[#f8e5da]' : 'bg-[#efe0d6]'}`}>
                  <td className={TABLE_STYLES.cellCategory}>Solde général (revenus − dépenses)</td>
                  <td className={TABLE_STYLES.cellAmount}>{formatCurrency(totalBudget)}</td>
                  <td className={TABLE_STYLES.cellAmount}>{formatCurrency(totalActual)}</td>
                  <td className={`${TABLE_STYLES.cellAmount} ${totalDifference < 0 ? 'text-red-700' : 'text-green-800'}`}>
                    {formatCurrency(totalDifference)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {uncategorizedGroup && uncategorizedGroup.records.length > 0 && (
        <p className="text-xs font-semibold text-[#a85a2a]">
          {uncategorizedGroup.records.length} opération{uncategorizedGroup.records.length > 1 ? 's' : ''} sans catégorie
          ({formatCurrency(uncategorizedGroup.totalAmount)}) ne figure{uncategorizedGroup.records.length > 1 ? 'nt' : ''} pas
          dans ce tableau : catégorise-les dans le rapprochement.
        </p>
      )}

      {categorizedTransactionCount === 0 && transactionCount > 0 && (
        <p className="text-xs text-[#766356]">
          Aucune transaction catégorisée dans le fichier importé.
        </p>
      )}
    </section>
  );
}