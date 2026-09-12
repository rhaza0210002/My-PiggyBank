"use client";

import React from 'react';
import { formatCurrency } from '@/utils/budgetCalculations';
import { BUDGET_MODES, BudgetMode } from '@/constants/budgetTypes';
import { MONTHS, TABLE_STYLES } from '@/constants/tableStyles'; // <-- Vérifie bien cet import
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
  // Calculs par mois (pour le mode annuel) ou pour le mois spécifique (pour le mode mensuel)
  const getValuesByMonth = (groupKey: string) => {
    const group = (dataGroups || []).find((g) => g.key === groupKey);
    if (!group || !group.rows) return MONTHS.map(() => 0);

    return MONTHS.map((_, monthIdx) => {
      return group.rows.reduce((sum, row) => {
        const val = Number(row?.values?.[monthIdx]) || 0;
        return Number(sum) + val;
      }, 0);
    });
  };

  const decaissementValues = getValuesByMonth('decaissement');
  const reserveValues = getValuesByMonth('reserve');
  const revenusValues = getValuesByMonth('revenus');

  // Calculs des restants par mois
  const restantAvecReserveValues = MONTHS.map((_, idx) => {
    return revenusValues[idx] - (decaissementValues[idx] + reserveValues[idx]);
  });

  const restantLibreValues = MONTHS.map((_, idx) => {
    return revenusValues[idx] - decaissementValues[idx];
  });

  // Si on est en mode mensuel, on extrait uniquement la valeur du mois sélectionné
  if (currentMode === BUDGET_MODES.MENSUEL) {
    const decVal = decaissementValues[currentMonthIndex] || 0;
    const resVal = reserveValues[currentMonthIndex] || 0;
    const revVal = revenusValues[currentMonthIndex] || 0;
    const restResVal = restantAvecReserveValues[currentMonthIndex] || 0;
    const restLibVal = restantLibreValues[currentMonthIndex] || 0;

    return (
      <div className="rounded-[1.5rem] sm:rounded-[2rem] border-[3px] border-[#d7b59d] border-dashed bg-[#f5eadf] p-3 sm:p-4 shadow-[0_3px_0_rgba(140,103,86,0.12)]">
        <h3 className="mb-4 px-2 text-[clamp(1.2rem,2vw,2.2rem)] font-black tracking-[-0.05em] text-[#5d4d44]">
          Total dépenses — {currentMonthLabel}
        </h3>

        <div className="w-full overflow-x-auto rounded-xl border border-[#d8b7a5]/50 bg-white/40 shadow-inner">
          <table className="w-full min-w-[320px] border-collapse text-left" role="region" aria-label="Tableau des totaux mensuels">
            <thead>
              <tr className="bg-[#f0d8c8] text-[#5a473d]">
                <th scope="col" className={TABLE_STYLES.thCategory}>Catégorie</th>
                <th scope="col" className={TABLE_STYLES.thAmount}>{currentMonthLabel}</th>
              </tr>
            </thead>
            <tbody>
              <tr className={TABLE_STYLES.rowEven}>
                <td className={TABLE_STYLES.cellCategory}>Total décaissement services</td>
                <td className={TABLE_STYLES.cellAmount}>{formatCurrency(decVal)}</td>
              </tr>
              <tr className={TABLE_STYLES.rowEven}>
                <td className={TABLE_STYLES.cellCategory}>Total décaissement de frais</td>
                <td className={TABLE_STYLES.cellAmount}>{formatCurrency(resVal)}</td>
              </tr>
              <tr className={TABLE_STYLES.rowOdd}>
                <td className={TABLE_STYLES.cellCategory}>Total de revenu</td>
                <td className={TABLE_STYLES.cellAmount}>{formatCurrency(revVal)}</td>
              </tr>
              <tr className={TABLE_STYLES.rowOdd}>
                <td className={TABLE_STYLES.cellCategory}>Total restant avec la réserve</td>
                <td className={TABLE_STYLES.cellAmount}>{formatCurrency(restResVal)}</td>
              </tr>
              <tr className={`${TABLE_STYLES.rowOdd} font-bold`}>
                <td className={TABLE_STYLES.cellCategory}>Total restant libre</td>
                <td className={TABLE_STYLES.cellAmount}>{formatCurrency(restLibVal)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Mode Annuel : Affichage de tous les mois en colonnes
  return (
    <div className="rounded-[1.5rem] sm:rounded-[2rem] border-[3px] border-[#d7b59d] border-dashed bg-[#f5eadf] p-3 sm:p-4 shadow-[0_3px_0_rgba(140,103,86,0.12)]">
      <h3 className="mb-4 px-2 text-[clamp(1.2rem,2vw,2.2rem)] font-black tracking-[-0.05em] text-[#5d4d44]">
        Totaux Annuels par mois
      </h3>

      <div className="w-full overflow-x-auto rounded-xl border border-[#d8b7a5]/50 bg-white/40 shadow-inner">
        <table className="w-full min-w-[840px] border-collapse text-left" role="region" aria-label="Tableau des totaux annuels">
          <thead>
            <tr className="bg-[#f0d8c8] text-[#5a473d]">
              <th scope="col" className={TABLE_STYLES.thCategory}>Catégorie</th>
              {MONTHS.map((month) => (
                <th key={month.key} scope="col" className={TABLE_STYLES.thAmount}>
                  {month.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            <tr className={TABLE_STYLES.rowEven}>
              <td className={TABLE_STYLES.cellCategory}>Total décaissement services</td>
              {decaissementValues.map((val, idx) => (
                <td key={`dec-${idx}`} className={TABLE_STYLES.cellAmount}>
                  {val === 0 ? '—' : formatCurrency(val)}
                </td>
              ))}
            </tr>

            <tr className={TABLE_STYLES.rowEven}>
              <td className={TABLE_STYLES.cellCategory}>Total décaissement de frais</td>
              {reserveValues.map((val, idx) => (
                <td key={`res-${idx}`} className={TABLE_STYLES.cellAmount}>
                  {val === 0 ? '—' : formatCurrency(val)}
                </td>
              ))}
            </tr>

            <tr className={TABLE_STYLES.rowOdd}>
              <td className={TABLE_STYLES.cellCategory}>Total de revenu</td>
              {revenusValues.map((val, idx) => (
                <td key={`rev-${idx}`} className={TABLE_STYLES.cellAmount}>
                  {val === 0 ? '—' : formatCurrency(val)}
                </td>
              ))}
            </tr>

            <tr className={TABLE_STYLES.rowOdd}>
              <td className={TABLE_STYLES.cellCategory}>Total restant avec la réserve</td>
              {restantAvecReserveValues.map((val, idx) => (
                <td key={`rest-res-${idx}`} className={TABLE_STYLES.cellAmount}>
                  {val === 0 ? '—' : formatCurrency(val)}
                </td>
              ))}
            </tr>

            <tr className={`${TABLE_STYLES.rowOdd} font-bold`}>
              <td className={TABLE_STYLES.cellCategory}>Total restant libre</td>
              {restantLibreValues.map((val, idx) => (
                <td key={`rest-lib-${idx}`} className={TABLE_STYLES.cellAmount}>
                  {val === 0 ? '—' : formatCurrency(val)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}