"use client";

import { startTransition, useState, useEffect } from "react";
import { DataGroup } from "@/types/budget";
import { getBudgetEntries, saveBudgetEntry } from "@/services/budgetService";
import {
  createCategory,
  getCategories,
  getCategoriesGroupKey,
} from "@/services/transactionCategoryService";

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
        let savedGroups: DataGroup[] = [];

        try {
          const savedData = localStorage.getItem("bilanAnnualData");
          savedGroups = savedData ? JSON.parse(savedData) : [];
        } catch {
          localStorage.removeItem("bilanAnnualData");
        }

        const groups = categoryGroups.map((categoryGroup) => {
          const groupKey = categoryGroup.label || String(categoryGroup.id);
          const savedRows =
            savedGroups.find(
              (group) =>
                group.key === groupKey || group.key === categoryGroup.libelle,
            )?.rows ?? [];
          const rowsByCategory = new Map(
            savedRows.map((row) => [row.category.toLowerCase(), row]),
          );
          const rows = categories
            .filter((category) => category.cat_group_key === categoryGroup.id)
            .map(
              (category) => {
                const savedRow = rowsByCategory.get(category.label.toLowerCase());
                const values = Array.from(
                  { length: 12 },
                  (_, monthIndex) => savedRow?.values?.[monthIndex] ?? "-",
                );

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
                  ...savedRow,
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

  useEffect(() => {
    if (isLoaded && dataGroups.length > 0) {
      localStorage.setItem("bilanAnnualData", JSON.stringify(dataGroups));
    }
  }, [dataGroups, isLoaded]);

  const updateRowValue = async (
    groupKey: string,
    category: string,
    monthIndex: number,
    amount: string,
  ) => {
    const parsedNumber = Number(amount);
    const parsedAmount =
      amount.trim() === "" || !Number.isFinite(parsedNumber) ? "-" : parsedNumber;
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

  const saveMonthBudget = async (monthIndex: number, year: number) => {
    const entries = dataGroups.flatMap((group) =>
      group.rows.flatMap((row) => {
        const categoryId = row.categoryId;
        if (!categoryId) return [];

        return row.values.flatMap((rawAmount, entryMonthIndex) => {
          if (
            entryMonthIndex < monthIndex ||
            rawAmount === undefined ||
            rawAmount === "-"
          ) {
            return [];
          }

          const amount = Number(rawAmount);
          return Number.isFinite(amount)
            ? [{ categoryId, monthIndex: entryMonthIndex, amount }]
            : [];
        });
      }),
    );

    await Promise.all(
      entries.map(({ categoryId, monthIndex: entryMonthIndex, amount }) =>
        saveBudgetEntry(categoryId, entryMonthIndex, amount, year),
      ),
    );

    return entries.length;
  };

  return { dataGroups, setDataGroups, isLoaded, updateRowValue, saveMonthBudget };
};

export default useBudget;