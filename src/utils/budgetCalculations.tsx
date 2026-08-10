import { BUDGET_MODES, BudgetMode } from '@/constants/budgetTypes';


// utils/budget.ts
export const calculateTotal = (rows: any[], monthIndex: number) => {
  return rows.reduce((sum, row) => {
    const val = row.values[monthIndex];
    const num = typeof val === 'number' ? val : parseFloat(val || 0);
    return sum + (isNaN(num) ? 0 : num);
  }, 0);
};

export const formatCurrency = (value: number | string) => {
  const num = typeof value === 'number' ? value : parseFloat(value as string);
  return isNaN(num) ? '—' : `${num.toFixed(0)}€`;
};

export const formatBudgetForView = (dataGroups, mode: BudgetMode, monthIndex?: number) => {
  if (mode === BUDGET_MODES.MENSUEL && monthIndex !== undefined) {
    // Logique spécifique au mois sélectionné
    return dataGroups.map(group => ({
      ...group,
      rows: group.rows.map(row => ({
        category: row.category,
        amount: row.values[monthIndex] ?? '-'
      }))
    }));
  }

  // Mode ANNUEL par défaut : on retourne tout tel quel
  return dataGroups;
}; 
export const getAdaptedRowsForView = (groupRows: any[], mode: BudgetMode, monthIndex: number) => {
  if (mode === BUDGET_MODES.MENSUEL) {
    return groupRows.map((row) => ({
      category: row.category,
      value: row.values[monthIndex] !== undefined ? row.values[monthIndex] : '-',
    }));
  }
  // Mode Annuel (si tu souhaites basculer plus tard)
  return groupRows;
};

export const handleBudgetDisplay = (groupRows: any[], mode: BudgetMode, monthIndex: number) => {
  switch (mode) {
    case BUDGET_MODES.MENSUEL:
      // Tu retournes directement le tableau filtré pour le mois
      return groupRows.map((row) => ({
        category: row.category,
        value: row.values[monthIndex] !== undefined ? row.values[monthIndex] : '-',
      }));

    case BUDGET_MODES.ANNUEL:
      // Tu retournes les lignes pour l'annuel (ou toutes les données)
      return groupRows;

    default:
      throw new Error("Mode de budget inconnu");
  }
};
