"use client";

import { startTransition, useState, useEffect } from "react";
import { DataGroup } from "@/types/budget";

const initialData: DataGroup[] = [
  {
    title: "Décaissement services",
    key: "decaissement",
    rows: [],
    accent: "bg-[#f0d8c8]",
  },
  {
    title: "Réserve de frais",
    key: "reserve",
    rows: [],
    accent: "bg-[#e5f0d9]",
  },
  { title: "Revenus", key: "revenus", rows: [], accent: "bg-[#dfeaf7]" },
];

export const useBudget = () => {
  const [dataGroups, setDataGroups] = useState<DataGroup[]>(initialData);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("bilanAnnualData");
    if (saved) {
      try {
        startTransition(() => setDataGroups(JSON.parse(saved)));
      } catch (e) {
        console.error("Erreur de parsing du localStorage", e);
      }
    }
    startTransition(() => setIsLoaded(true));
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("bilanAnnualData", JSON.stringify(dataGroups));
    }
  }, [dataGroups, isLoaded]);

  // Fonction d'ajout ou de mise à jour unifiée intégrée au hook
  const updateRowValue = (
    groupKey: string,
    category: string,
    monthIndex: number,
    amount: string,
  ) => {
    const parsedAmount =
      amount === "" || isNaN(Number(amount)) ? "-" : Number(amount);

    setDataGroups((prevGroups) =>
      prevGroups.map((group) => {
        if (group.key === groupKey) {
          const existingRowIndex = group.rows.findIndex(
            (r) => r.category.toLowerCase() === category.toLowerCase(),
          );

          if (existingRowIndex > -1) {
            const updatedRows = [...group.rows];
            const newValues = [...updatedRows[existingRowIndex].values];

            while (newValues.length < 12) {
              newValues.push("-");
            }
            newValues[monthIndex] = parsedAmount;
            updatedRows[existingRowIndex] = {
              ...updatedRows[existingRowIndex],
              values: newValues,
            };

            return { ...group, rows: updatedRows };
          } else {
            const defaultValues = Array(12).fill("-");
            defaultValues[monthIndex] = parsedAmount;

            return {
              ...group,
              rows: [...group.rows, { category, values: defaultValues }],
            };
          }
        }
        return group;
      }),
    );
  };

  return { dataGroups, setDataGroups, isLoaded, updateRowValue };
};
