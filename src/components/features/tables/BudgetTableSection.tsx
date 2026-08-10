"use client";

import React from 'react';
import { formatCurrency } from '@/utils/budgetCalculations';
import { BUDGET_MODES, BudgetMode } from '@/constants/budgetTypes';

interface BudgetTotalsSectionProps {
  dataGroups: Array<{
    key: string;
    rows: Array<{ values: (number | string)[] }>;
  }>;
  currentMode: BudgetMode;
  currentMonthIndex: number;
  currentMonthLabel: string;
}

export default function BudgetTotalsSection({
  dataGroups,
  currentMode,
  currentMonthIndex,
  currentMonthLabel,
}: BudgetTotalsSectionProps) {
  // Sécurisation avec (dataGroups || []) pour éviter le crash si c'est undefined
  const totals = (dataGroups || []).reduce((acc, group) => {
    const groupTotal = (group?.rows || []).reduce((sum, row) => {
      const val = currentMode === BUDGET_MODES.MENSUEL
        ? Number(row?.values?.[currentMonthIndex]) || 0
        : (row?.values || []).reduce((monthlySum, v) => Number(monthlySum) + (Number(v) || 0), 0);
      return Number(sum) + Number(val);
    }, 0);

    return { ...acc, [group.key]: groupTotal };
  }, {} as Record<string, number>);

  return (
    <div className="rounded-[1.5rem] sm:rounded-[2rem] border-[3px] border-[#d7b59d] border-dashed bg-[#f5eadf] p-3 sm:p-4 shadow-[0_3px_0_rgba(140,103,86,0.12)]">
      <h3 className="mb-4 px-2 text-[clamp(1.2rem,2vw,2.2rem)] font-black tracking-[-0.05em] text-[#5d4d44]">
        Totaux {currentMode === BUDGET_MODES.MENSUEL ? `— ${currentMonthLabel}` : 'Annuels'}
      </h3>

      <div className="w-full overflow-x-auto rounded-xl border border-[#d8b7a5]/50 bg-white/40 shadow-inner">
        <table className="w-full min-w-[320px] border-collapse text-left" role="region" aria-label="Tableau des totaux">
          <thead>
            <tr className="bg-[#f0d8c8] text-[#5a473d]">
              <th scope="col" className="border-r border-[#d8b7a5] px-4 py-3 text-left text-[1rem] sm:text-[1.1rem] font-bold">Catégorie</th>
              <th scope="col" className="px-4 py-3 text-center text-[1rem] sm:text-[1.1rem] font-bold whitespace-nowrap">
                Total {currentMode === BUDGET_MODES.MENSUEL ? `(${currentMonthLabel})` : ''}
              </th>
            </tr>
          </thead>

          <tbody>
            <tr className="bg-[#f7e8df]">
              <td className="border-r border-[#d8b7a5] border-t border-[#d8b7a5] px-4 py-3 text-[1rem] sm:text-[1.1rem] font-semibold text-[#54433d]">
                Décaissement services
              </td>
              <td className="border-t border-[#d8b7a5] px-4 py-3 text-center text-[1rem] sm:text-[1.1rem] font-semibold text-[#4a3d37] whitespace-nowrap">
                {formatCurrency(totals['decaissement'] || 0)}
              </td>
            </tr>

            <tr className="bg-[#e5f0d9]">
              <td className="border-r border-[#d8b7a5] border-t border-[#d8b7a5] px-4 py-3 text-[1rem] sm:text-[1.1rem] font-semibold text-[#54433d]">
                Réserve de frais
              </td>
              <td className="border-t border-[#d8b7a5] px-4 py-3 text-center text-[1rem] sm:text-[1.1rem] font-semibold text-[#4a3d37] whitespace-nowrap">
                {formatCurrency(totals['reserve'] || 0)}
              </td>
            </tr>

            <tr className="bg-[#dfeaf7] font-bold">
              <td className="border-r border-[#d8b7a5] border-t border-[#d8b7a5] px-4 py-3 text-[1rem] sm:text-[1.1rem] text-[#54433d]">
                Revenus
              </td>
              <td className="border-t border-[#d8b7a5] px-4 py-3 text-center text-[1rem] sm:text-[1.1rem] text-[#4a3d37] whitespace-nowrap">
                {formatCurrency(totals['revenus'] || 0)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}