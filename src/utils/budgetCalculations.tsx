import { BUDGET_MODES, BudgetMode } from '@/constants/budgetTypes';

interface BudgetRow {
  category: string;
  values: Array<number | string | null | undefined>;
}

interface BudgetGroup {
  id?: string;
  label?: string;
  rows: BudgetRow[];
  [key: string]: unknown;
}

export const calculateTotal = (rows: BudgetRow[], monthIndex: number) => {
  return rows.reduce((sum: number, row: BudgetRow) => {
    const val = row.values[monthIndex];
    const num = typeof val === 'number' ? val : parseFloat(String(val ?? 0));
    return sum + (isNaN(num) ? 0 : num);
  }, 0);
};

export const formatCurrency = (value: number | string) => {
  const num = typeof value === 'number' ? value : parseFloat(String(value));
  return isNaN(num) ? '—' : `${num.toFixed(0)}€`;
};

export const formatBudgetForView = (dataGroups: BudgetGroup[], mode: BudgetMode, monthIndex?: number) => {
  if (mode === BUDGET_MODES.MENSUEL && monthIndex !== undefined) {
    return dataGroups.map((group: BudgetGroup) => ({
      ...group,
      rows: group.rows.map((row: BudgetRow) => ({
        category: row.category,
        amount: row.values[monthIndex] ?? '-',
      })),
    }));
  }

  return dataGroups;
};

export const getAdaptedRowsForView = (groupRows: BudgetRow[], mode: BudgetMode, monthIndex: number) => {
  if (mode === BUDGET_MODES.MENSUEL) {
    return groupRows.map((row: BudgetRow) => ({
      category: row.category,
      value: row.values[monthIndex] !== undefined ? row.values[monthIndex] : '-',
    }));
  }

  return groupRows;
};

export const handleBudgetDisplay = (groupRows: BudgetRow[], mode: BudgetMode, monthIndex: number) => {
  switch (mode) {
    case BUDGET_MODES.MENSUEL:
      return groupRows.map((row: BudgetRow) => ({
        category: row.category,
        value: row.values[monthIndex] !== undefined ? row.values[monthIndex] : '-',
      }));

    case BUDGET_MODES.ANNUEL:
      return groupRows;

    default:
      throw new Error('Mode de budget inconnu');
  }
};
