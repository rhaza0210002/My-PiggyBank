"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import FormBilan from '@/components/features/forms/FormBilan';
import BudgetTotalsSection from '@/components/features/tables/BudgetTableSection';
import { useBudget } from '@/hooks/useBudget';
import { formatCurrency } from '@/utils/budgetCalculations';
import { BUDGET_MODES, BudgetMode } from '@/constants/budgetTypes';
import { TABLE_STYLES, MONTHS } from '@/constants/tableStyles';

// Fonction de gestion du switch pour adapter l'affichage des lignes selon le mode
const handleBudgetDisplay = (groupRows: any[], mode: BudgetMode, monthIndex: number) => {
  switch (mode) {
    case BUDGET_MODES.MENSUEL:
      return (groupRows || []).map((row) => ({
        category: row.category,
        value: row?.values?.[monthIndex] !== undefined ? row.values[monthIndex] : '-',
      }));

    case BUDGET_MODES.ANNUEL:
      return groupRows;

    default:
      throw new Error("Mode de budget inconnu");
  }
};

export default function MonthBudgetPage() {
  const { dataGroups, isLoaded, updateRowValue } = useBudget();

  const [currentMode] = useState<BudgetMode>(BUDGET_MODES.MENSUEL);

  // Initialisation sécurisée pour éviter les erreurs d'hydratation SSR
  const [currentMonthIndex, setCurrentMonthIndex] = useState<number>(0);

  useEffect(() => {
    const nowMonth = new Date().getMonth();
    if (nowMonth >= 0 && nowMonth < MONTHS.length) {
      setCurrentMonthIndex(nowMonth);
    }
  }, []);

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#ebcfc6] text-[#5b473d]">
        <p className="text-sm font-semibold">Chargement...</p>
      </div>
    );
  }

  const handlePrevMonth = () => {
    setCurrentMonthIndex((prev) => (prev > 0 ? prev - 1 : MONTHS.length - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonthIndex((prev) => (prev < MONTHS.length - 1 ? prev + 1 : 0));
  };

  const handleAddRow = (data: { groupKey: string; category: string; amount: string; monthIndex: number }) => {
    updateRowValue(data.groupKey, data.category, data.monthIndex, data.amount);
  };

  const activeMonth = MONTHS[currentMonthIndex];

  return (
    <div className="min-h-screen bg-[#ebcfc6] px-3 py-4 text-[#5b473d] sm:px-6 sm:py-6 lg:px-10">

      {/* Bouton de retour */}
      <div className="flex justify-center mb-6">
        <Link
          href="/budgetannual"
          className="w-80 max-w-[360px] rounded-[1.75rem] border-[3px] border-[#e4a58f] bg-[#e59a86] px-6 py-4 text-center text-[clamp(1.1rem,2vw,1.6rem)] font-black text-[#fff8f5] shadow-[0_6px_0_rgba(171,98,77,0.85)] transition-transform hover:translate-y-[2px] hover:shadow-[0_4px_0_rgba(171,98,77,0.85)]"
        >
          Retour au Bilan Annuel
        </Link>
      </div>

      <div className="mx-auto max-w-[1200px] rounded-[1.8rem] sm:rounded-[2.2rem] border-[3px] border-[#d8b6a5] bg-[#f2e6d8] p-3 sm:p-5 shadow-[inset_0_0_0_3px_rgba(255,255,255,0.18)] space-y-6">

        {/* Navigation des mois conditionnée par le mode */}
        {currentMode === BUDGET_MODES.MENSUEL && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-[1.5rem] sm:rounded-[2rem] border-[3px] border-[#d7b59d] bg-[#f5eadf] p-4 shadow-[0_3px_0_rgba(140,103,86,0.12)]">
            <button
              onClick={handlePrevMonth}
              aria-label="Mois précédent"
              className="w-full sm:w-auto rounded-xl border-2 border-[#d8b7a5] bg-[#f2e6d8] px-4 py-2 font-bold text-[#5a473d] shadow-sm transition-transform active:translate-y-[1px]"
            >
              ← Mois précédent
            </button>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-center">
              <label htmlFor="month-selector" className="font-bold text-[#5d4d44]">Mois :</label>
              <select
                id="month-selector"
                value={currentMonthIndex}
                onChange={(e) => setCurrentMonthIndex(Number(e.target.value))}
                className="rounded-xl border-2 border-[#d8b7a5] bg-white px-4 py-2 text-[1.1rem] font-bold text-[#54433d] outline-none focus:ring-2 focus:ring-[#e59a86]"
              >
                {MONTHS.map((m, idx) => (
                  <option key={m.key} value={idx}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleNextMonth}
              aria-label="Mois suivant"
              className="w-full sm:w-auto rounded-xl border-2 border-[#d8b7a5] bg-[#f2e6d8] px-4 py-2 font-bold text-[#5a473d] shadow-sm transition-transform active:translate-y-[1px]"
            >
              Mois suivant →
            </button>
          </div>
        )}

        <div>
          <FormBilan groups={dataGroups} months={MONTHS} onAddRow={handleAddRow} />
        </div>

        {/* Affichage des tableaux distincts par groupe */}
        <div className="space-y-6">
          {(dataGroups || []).map((group) => {
            const rowsForDisplay = handleBudgetDisplay(group?.rows || [], currentMode, currentMonthIndex);

            return (
              <div key={group.key} className="rounded-[1.5rem] sm:rounded-[2rem] border-[3px] border-[#d7b59d] border-dashed bg-[#f5eadf] p-3 sm:p-4 shadow-[0_3px_0_rgba(140,103,86,0.12)]">
                <h3 className="mb-4 px-2 text-[clamp(1.2rem,2vw,2.2rem)] font-black tracking-[-0.05em] text-[#5d4d44]">
                  {group.title} {currentMode === BUDGET_MODES.MENSUEL && `— ${activeMonth.label}`}
                </h3>

                <div className="w-full overflow-x-auto rounded-xl border border-[#d8b7a5]/50 bg-white/40 shadow-inner">
                  <table className="w-full min-w-[320px] border-collapse text-left" role="region" aria-label={`Tableau de ${group.title}`}>
                    <thead>
                      <tr className={`${group.accent} text-[#5a473d]`}>
                        <th scope="col" className={TABLE_STYLES.thCategory}>Catégorie</th>
                        <th scope="col" className={TABLE_STYLES.thAmount}>
                          Montant {currentMode === BUDGET_MODES.MENSUEL ? `(${activeMonth.label})` : ''}
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {rowsForDisplay.length === 0 ? (
                        <tr>
                          <td colSpan={2} className="py-6 text-center text-[1rem] sm:text-[1.1rem] italic text-[#8c7366]">
                            Aucune donnée pour cette période.
                          </td>
                        </tr>
                      ) : (
                        rowsForDisplay.map((item: any, index: number) => (
                          <tr
                            key={`${group.key}-${item.category}-${index}`}
                            className={index % 2 === 0 ? TABLE_STYLES.rowEven : TABLE_STYLES.rowOdd}
                          >
                            <td className={TABLE_STYLES.cellCategory}>
                              {item.category}
                            </td>
                            <td className={TABLE_STYLES.cellAmount}>
                              {formatCurrency(item.value)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>

        {/* Section récapitulative des totaux */}
        <div>
          <BudgetTotalsSection
            dataGroups={dataGroups}
            currentMode={currentMode}
            currentMonthIndex={currentMonthIndex}
            currentMonthLabel={activeMonth.label}
          />
        </div>
      </div>
    </div>
  );
}