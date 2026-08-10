export const BUDGET_MODES = {
  MENSUEL: 1,
  ANNUEL: 2,
} as const;

export const BUDGET_TYPES = {
  CB: 1,
  VIREMENT: 2,
} as const;

export type BudgetMode = (typeof BUDGET_MODES)[keyof typeof BUDGET_MODES];
