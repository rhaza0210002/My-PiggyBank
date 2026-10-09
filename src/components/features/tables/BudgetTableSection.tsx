"use client";

import React from 'react';
import { formatCurrency } from '@/utils/budgetCalculations';
import { BUDGET_MODES, BudgetMode } from '@/constants/budgetTypes';
import { MONTHS, TABLE_STYLES } from '@/constants/tableStyles'; // <-- Vérifie bien cet import
interface BudgetTotalsSectionProps {
  dataGroups: Array<{
    key: string;
    title?: string;
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
  const normalizeGroupName = (value: string) =>
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');

  const getValuesByGroup = (matchesGroup: (groupName: string) => boolean) => {
    const matchingGroups = dataGroups.filter((group) =>
      matchesGroup(normalizeGroupName(`${group.key} ${group.title ?? ''}`)),
    );

    return MONTHS.map((_, monthIdx) => {
      return matchingGroups.reduce(
        (groupTotal, group) =>
          groupTotal +
          group.rows.reduce((rowTotal, row) => {
            const value = Number(row.values[monthIdx]);
            return rowTotal + (Number.isFinite(value) ? value : 0);
          }, 0),
        0,
      );
    });
  };

  const decaissementValues = getValuesByGroup((name) =>
    name.includes('decaissement') && !name.includes('frais') && !name.includes('reserve'),
  );
  const reserveValues = getValuesByGroup((name) =>
    name.includes('reserve') || name.includes('frais'),
  );
  const revenusValues = getValuesByGroup((name) => name.includes('revenu'));

  const restantAvecReserveValues = MONTHS.map((_, idx) => {
    return revenusValues[idx] - decaissementValues[idx];
  });
  const restantLibreValues = MONTHS.map((_, idx) => {
    return restantAvecReserveValues[idx] - reserveValues[idx];
  });

  // Si on est en mode mensuel, on extrait uniquement la valeur du mois sélectionné
  if (currentMode === BUDGET_MODES.MENSUEL) {
    const decVal = decaissementValues[currentMonthIndex] || 0;
    const resVal = reserveValues[currentMonthIndex] || 0;
    const revVal = revenusValues[currentMonthIndex] || 0;
    const restAvecReserveVal = restantAvecReserveValues[currentMonthIndex] || 0;
    const restLibVal = restantLibreValues[currentMonthIndex] || 0;

    return (
      <div className="rounded-carte sm:rounded-carte border-[3px] border-bordure border-dashed bg-surface-douce p-3 sm:p-4 shadow-bonbon">
        <h2 className="mb-2 px-2 text-center text-[clamp(1rem,1.5vw,1.25rem)] font-black tracking-[-0.05em] text-texte">
          Total dépenses — {currentMonthLabel}
        </h2>

        <div role="region" aria-label="Tableau des totaux" tabIndex={0} className="w-full overflow-x-auto rounded-xl border border-bordure/50 bg-surface/40 shadow-inner">
          <table className="w-full min-w-[320px] border-collapse text-left" aria-label="Tableau des totaux mensuels">
            <thead>
              <tr className="bg-surface-douce text-texte">
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
                <td className={TABLE_STYLES.cellAmount}>{formatCurrency(restAvecReserveVal)}</td>
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
    <div className="rounded-carte sm:rounded-carte border-[3px] border-bordure border-dashed bg-surface-douce p-3 sm:p-4 shadow-bonbon">
      <h2 className="mb-2 px-2 text-center text-[clamp(1rem,1.5vw,1.25rem)] font-black tracking-[-0.05em] text-texte">
        Totaux Annuels par mois
      </h2>

      <div role="region" aria-label="Tableau des totaux" tabIndex={0} className="w-full overflow-x-auto rounded-xl border border-bordure/50 bg-surface/40 shadow-inner">
        <table className="w-full min-w-[840px] border-collapse text-left" aria-label="Tableau des totaux annuels">
          <thead>
            <tr className="bg-surface-douce text-texte">
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