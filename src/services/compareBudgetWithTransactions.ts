import { BankTransaction } from './csvParser';

export type CategoryBudget = {
  categoryId: string;
  categoryLabel: string;
  targetAmount: number; // Montant prévisionnel attendu
};

export type BudgetComparisonResult = {
  categoryId: string;
  categoryLabel: string;
  targetAmount: number;
  actualAmount: number; // Montant réel total calculé depuis les CSV
  difference: number;   // Écart (Réel - Prévisionnel)
  transactions: BankTransaction[];
};

/**
 * Compare le budget prévisionnel avec les transactions réelles importées du CSV
 */
export function compareBudgetWithTransactions(
  budgetList: CategoryBudget[],
  transactions: BankTransaction[]
): BudgetComparisonResult[] {
  return budgetList.map((budget) => {
    // Filtrer les transactions correspondant à la catégorie courante
    const matchingTransactions = transactions.filter(
      (tx) => tx.categoryId === budget.categoryId
    );

    // Sommer les montants réels (les dépenses sont généralement négatives, 
    // on gère la valeur absolue ou la somme brute selon ta logique métier)
    const actualAmount = matchingTransactions.reduce(
      (sum, tx) => sum + tx.amount,
      0
    );

    const difference = actualAmount - budget.targetAmount;

    return {
      categoryId: budget.categoryId,
      categoryLabel: budget.categoryLabel,
      targetAmount: budget.targetAmount,
      actualAmount,
      difference,
      transactions: matchingTransactions,
    };
  });
}