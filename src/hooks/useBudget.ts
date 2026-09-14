"use client";

import { useEffect, useState } from "react";
import { DataGroup } from "@/types/budget";
import { getTransactCatGroupKeys } from "@/services/transactCatGroupKeyService";

const fallbackData: DataGroup[] = [];

export const useBudget = () => {
  const [dataGroups, setDataGroups] = useState<DataGroup[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchGroups = async () => {
      try {
        const data = await getTransactCatGroupKeys();

        if (!isMounted) return;

        const mappedGroups: DataGroup[] = data.map((item) => ({
          title: item.label,
          key: item.key,
          rows: [],
          accent: "#e59a86",
        }));

        setDataGroups(mappedGroups);
      } catch (error) {
        console.error("Erreur récupération des groupes:", error);
        if (isMounted) {
          setDataGroups(fallbackData);
        }
      } finally {
        if (isMounted) {
          setIsLoaded(true);
        }
      }
    };

    fetchGroups();

    return () => {
      isMounted = false;
    };
  }, []);

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
          }

          const defaultValues = Array(12).fill("-");
          defaultValues[monthIndex] = parsedAmount;

          return {
            ...group,
            rows: [...group.rows, { category, values: defaultValues }],
          };
        }

        return group;
      }),
    );
  };

  return { dataGroups, setDataGroups, isLoaded, updateRowValue };
};
