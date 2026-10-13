"use client";

import { startTransition, useState, useEffect } from "react";
import { DataGroup } from "@/types/budget";
import { getBudgetEntries, saveBudgetEntry } from "@/services/budgetService";
import {
  createCategory,
  getCategories,
  getCategoriesGroupKey,
} from "@/services/transactionCategoryService";

/** Montant saisi : un nombre de 0 à 1 000 000 €, au centime près (virgule acceptée). */
export function parseBudgetAmount(amount: string): number {
  const text = amount.trim().replace(/s/g, "").replace(",", ".");
  if (text === "") throw new Error("Indique un montant (0 si rien n’est prévu).");
  const value = Number(text);
  if (!Number.isFinite(value) || value < 0 || value > 1_000_000) {
    throw new Error("Le montant doit être un nombre entre 0 et 1 000 000 €.");
  }
  return Math.round(value * 100) / 100;
}

export const useBudget = () => {
  const [dataGroups, setDataGroups] = useState<DataGroup[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    async function fetchBudget() {
      try {
        const year = new Date().getFullYear();
        const [categoryGroups, categories, budgetEntries] = await Promise.all([
          getCategoriesGroupKey(),
          getCategories(),
          getBudgetEntries(year),
        ]);
        // La base est la seule source : rien n'est gardé dans le navigateur (une valeur affichée est enregistrée).
        const groups = categoryGroups.map((categoryGroup) => {
          const groupKey = categoryGroup.label || String(categoryGroup.id);
          const rows = categories
            .filter((category) => category.cat_group_key === categoryGroup.id)
            .map(
              (category) => {
                const values: (number | string)[] = Array.from({ length: 12 }, () => "-");

                budgetEntries
                  .filter((entry) => entry.category_id === category.id)
                  .forEach((entry) => {
                    if (entry.month_index >= 0 && entry.month_index < values.length) {
                      values[entry.month_index] = Number(entry.amount);
                    }
                  });

                for (let monthIndex = 1; monthIndex < values.length; monthIndex++) {
                  const previousValue = values[monthIndex - 1];
                  if (
                    (values[monthIndex] === "-" || values[monthIndex] === undefined) &&
                    previousValue !== "-" &&
                    previousValue !== undefined
                  ) {
                    values[monthIndex] = previousValue;
                  }
                }

                return {
                  categoryId: category.id,
                  category: category.label,
                  values,
                };
              },
            );

          return {
            id: categoryGroup.id,
            title: categoryGroup.libelle,
            key: groupKey,
            rows,
          };
        });

        startTransition(() => setDataGroups(groups));
      } catch (error) {
        console.error("Erreur lors de la récupération du budget :", error);
      } finally {
        startTransition(() => setIsLoaded(true));
      }
    }

    fetchBudget();
  }, []);

  const updateRowValue = async (
    groupKey: string,
    category: string,
    monthIndex: number,
    amount: string,
  ) => {
    const parsedAmount = parseBudgetAmount(amount);
    const selectedGroup = dataGroups.find((group) => group.key === groupKey);
    const normalizedCategory = category.trim();

    if (!selectedGroup) {
      throw new Error("Veuillez sélectionner un groupe de catégories.");
    }
    if (!normalizedCategory) {
      throw new Error("Le nom de la catégorie est obligatoire.");
    }

    const categories = await getCategories();
    const existingCategory = categories.find(
      (item) =>
        item.label.trim().toLowerCase() === normalizedCategory.toLowerCase() &&
        item.cat_group_key === selectedGroup.id,
    );

    const savedCategory = existingCategory ??
      await createCategory(normalizedCategory, selectedGroup.id);

    // Enregistré tout de suite, pour ce mois et les suivants : ce qui s'affiche est ce qui est gardé.
    const year = new Date().getFullYear();
    await Promise.all(
      Array.from({ length: 12 - monthIndex }, (_, offset) =>
        saveBudgetEntry(savedCategory.id, monthIndex + offset, parsedAmount, year),
      ),
    );

    setDataGroups((prevGroups) =>
      prevGroups.map((group) => {
        if (group.key !== groupKey) return group;

        const existingRowIndex = group.rows.findIndex(
          (row) => row.category.toLowerCase() === normalizedCategory.toLowerCase(),
        );

        if (existingRowIndex > -1) {
          const updatedRows = [...group.rows];
          const newValues = [...updatedRows[existingRowIndex].values];

          while (newValues.length < 12) newValues.push("-");
          for (let futureMonthIndex = monthIndex; futureMonthIndex < 12; futureMonthIndex++) {
            newValues[futureMonthIndex] = parsedAmount;
          }
          updatedRows[existingRowIndex] = {
            ...updatedRows[existingRowIndex],
            categoryId: savedCategory.id,
            values: newValues,
          };

          return { ...group, rows: updatedRows };
        }

        const values = Array(12).fill("-");
        for (let futureMonthIndex = monthIndex; futureMonthIndex < 12; futureMonthIndex++) {
          values[futureMonthIndex] = parsedAmount;
        }
        return {
          ...group,
          rows: [...group.rows, {
            categoryId: savedCategory.id,
            category: normalizedCategory,
            values,
          }],
        };
      }),
    );
  };

  return { dataGroups, setDataGroups, isLoaded, updateRowValue };
};

export default useBudget;