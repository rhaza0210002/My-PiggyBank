"use client";

import React, { startTransition, useState, useEffect } from 'react';
import Link from 'next/link';
import FormBilan from '@/components/features/forms/FormBilan';
import BudgetDonut from '@/components/features/charts/AnnualBudgetDonut';
import BudgetTotalsSection from '@/components/features/tables/BudgetTableSection';
import BudgetGroupTable from '@/components/features/tables/BudgetGroupTable';
import { useBudget } from '@/hooks/useBudget';
import { BUDGET_MODES, BudgetMode } from '@/constants/budgetTypes';
import { MONTHS } from '@/constants/tableStyles';

export default function MonthBudgetPage() {
  const { dataGroups, isLoaded, updateRowValue, saveMonthBudget } = useBudget();
  const currentCalendarMonth = new Date().getMonth();

  const [currentMode] = useState<BudgetMode>(BUDGET_MODES.MENSUEL);
  const [isSavingBudget, setIsSavingBudget] = useState(false);
  const [budgetSaveMessage, setBudgetSaveMessage] = useState<string | null>(null);
  const [budgetSaveError, setBudgetSaveError] = useState<string | null>(null);

  // Initialisation sécurisée pour éviter les erreurs d'hydratation SSR
  const [currentMonthIndex, setCurrentMonthIndex] = useState<number>(0);

  useEffect(() => {
    const nowMonth = new Date().getMonth();
    if (nowMonth >= 0 && nowMonth < MONTHS.length) {
      startTransition(() => setCurrentMonthIndex(nowMonth));
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
    setCurrentMonthIndex((previousMonth) =>
      previousMonth > currentCalendarMonth ? previousMonth - 1 : previousMonth,
    );
  };

  const handleNextMonth = () => {
    setCurrentMonthIndex((previousMonth) =>
      previousMonth < MONTHS.length - 1 ? previousMonth + 1 : previousMonth,
    );
  };

  const handleAddRow = async (data: { groupKey: string; category: string; amount: string; monthIndex: number }) => {
    if (data.monthIndex < currentCalendarMonth) {
      throw new Error('Les budgets des mois antérieurs sont en lecture seule.');
    }

    await updateRowValue(data.groupKey, data.category, data.monthIndex, data.amount);
  };

  const handleUpdateAmount = async (
    groupKey: string,
    category: string,
    monthIndex: number,
    amount: string,
  ) => {
    if (monthIndex < currentCalendarMonth) {
      throw new Error('Les budgets des mois antérieurs sont en lecture seule.');
    }

    await updateRowValue(groupKey, category, monthIndex, amount);
  };

  const handleSaveBudget = async () => {
    setIsSavingBudget(true);
    setBudgetSaveMessage(null);
    setBudgetSaveError(null);

    try {
      const savedEntries = await saveMonthBudget(
        currentMonthIndex,
        new Date().getFullYear(),
      );
      setBudgetSaveMessage(
        savedEntries > 0
          ? `Budget de ${activeMonth.label} et des mois suivants enregistré (${savedEntries} montants).`
          : `Aucun montant à enregistrer pour ${activeMonth.label}.`,
      );
    } catch (error) {
      setBudgetSaveError(
        error instanceof Error
          ? error.message
          : "Impossible d'enregistrer le budget.",
      );
    } finally {
      setIsSavingBudget(false);
    }
  };

  const activeMonth = MONTHS[currentMonthIndex];
  const isPastMonth = currentMonthIndex < currentCalendarMonth;

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
              disabled={currentMonthIndex <= currentCalendarMonth}
              aria-label="Mois précédent"
              className="w-full rounded-xl border-2 border-[#d8b7a5] bg-[#f2e6d8] px-4 py-2 font-bold text-[#5a473d] shadow-sm transition-transform active:translate-y-[1px] disabled:cursor-not-allowed disabled:border-gray-300 disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none sm:w-auto"
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
                  <option key={m.key} value={idx} disabled={idx < currentCalendarMonth}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleNextMonth}
              disabled={currentMonthIndex >= MONTHS.length - 1}
              aria-label="Mois suivant"
              className="w-full rounded-xl border-2 border-[#d8b7a5] bg-[#f2e6d8] px-4 py-2 font-bold text-[#5a473d] shadow-sm transition-transform active:translate-y-[1px] disabled:cursor-not-allowed disabled:border-gray-300 disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none sm:w-auto"
            >
              Mois suivant →
            </button>
          </div>
        )}

        <div>
          <FormBilan
            groups={dataGroups}
            monthIndex={currentMonthIndex}
            onAddRow={handleAddRow}
            readOnly={isPastMonth}
          />
        </div>

        {/* Affichage des tableaux distincts par groupe */}
        <div className="space-y-6">
          {dataGroups.map((group) => (
            <BudgetGroupTable
              key={group.key}
              group={group}
              monthIndex={currentMonthIndex}
              monthLabel={activeMonth.label}
              readOnly={isPastMonth}
              onUpdateAmount={handleUpdateAmount}
            />
          ))}
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

        <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={handleSaveBudget}
            disabled={isSavingBudget || isPastMonth || dataGroups.length === 0}
            className="rounded-xl mx-auto border-2 border-[#6e8f72] bg-[#7fa984] px-5 py-2.5 text-sm font-bold text-white shadow-[0_3px_0_rgba(69,105,74,0.8)] transition-transform hover:translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSavingBudget ? 'Enregistrement...' : 'Valider budget'}
          </button>
          {budgetSaveMessage && (
            <p className="text-sm font-semibold text-green-800" role="status">
              {budgetSaveMessage}
            </p>
          )}
          {budgetSaveError && (
            <p className="text-sm font-semibold text-red-700" role="alert">
              {budgetSaveError}
            </p>
          )}
        </div>

        <BudgetDonut
          dataGroups={dataGroups}
          monthIndex={currentMonthIndex}
          monthLabel={activeMonth.label}
        />
      </div>
    </div>
  );
}