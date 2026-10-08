"use client";

import React, { startTransition, useState, useEffect } from 'react';
import FormBilan from '@/components/features/forms/FormBilan';
import BudgetDonut from '@/components/features/charts/AnnualBudgetDonut';
import BudgetTotalsSection from '@/components/features/tables/BudgetTableSection';
import BudgetGroupTable from '@/components/features/tables/BudgetGroupTable';
import { useBudget } from '@/hooks/useBudget';
import { BUDGET_MODES, BudgetMode } from '@/constants/budgetTypes';
import { MONTHS } from '@/constants/tableStyles';
import ScreenCard from '@/components/ui/ScreenCard';
import SectionStack from '@/components/ui/SectionStack';
import { getTransactionsForMonth } from '@/services/transactionService';
import { suggestBudgetAmounts } from '@/utils/budgetSuggestion';

export default function MonthBudgetPage() {
  const { dataGroups, isLoaded, updateRowValue, saveMonthBudget } = useBudget();
  const [suggestionMessage, setSuggestionMessage] = useState<string | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
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

  /** Remplit les lignes vides avec le réel du mois (ou du dernier mois qui en a) : à relire, puis « Valider budget ». */
  const handleSuggest = async () => {
    setIsSuggesting(true);
    setSuggestionMessage(null);
    setBudgetSaveError(null);

    try {
      const year = new Date().getFullYear();
      let sourceMonth = currentMonthIndex;
      let transactions = await getTransactionsForMonth(year, sourceMonth);
      while (transactions.length === 0 && sourceMonth > 0) {
        sourceMonth -= 1;
        transactions = await getTransactionsForMonth(year, sourceMonth);
      }

      const suggestions = suggestBudgetAmounts(transactions, dataGroups, currentMonthIndex);
      for (const suggestion of suggestions) {
        await updateRowValue(suggestion.groupKey, suggestion.category, currentMonthIndex, String(suggestion.amount));
      }

      setSuggestionMessage(
        suggestions.length > 0
          ? `${suggestions.length} montant${suggestions.length > 1 ? 's' : ''} proposé${suggestions.length > 1 ? 's' : ''} d’après ${MONTHS[sourceMonth].label.toLowerCase()}. Relis-les, change ce que tu veux, puis « Valider budget ».`
          : 'Rien à proposer : aucune dépense catégorisée sur les lignes encore vides. Importe ton relevé et pointe-le d’abord.',
      );
    } catch (error) {
      setBudgetSaveError(error instanceof Error ? error.message : 'Impossible de proposer un budget.');
    } finally {
      setIsSuggesting(false);
    }
  };

  const activeMonth = MONTHS[currentMonthIndex];
  const isPastMonth = currentMonthIndex < currentCalendarMonth;

  const monthControls = (
    <div className="flex items-center gap-1 rounded-xl border border-[#d8b7a5] bg-white/70 p-1">
      <button
        type="button"
        onClick={handlePrevMonth}
        disabled={currentMonthIndex <= currentCalendarMonth}
        aria-label="Mois précédent"
        className="flex h-11 w-11 items-center justify-center rounded-lg font-bold text-[#5a473d] hover:bg-white focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#5b473d] disabled:cursor-not-allowed disabled:text-[#8a8a8a]"
      >
        <span aria-hidden="true">←</span>
      </button>
      <label htmlFor="month-selector" className="sr-only">Mois</label>
      <select
        id="month-selector"
        value={currentMonthIndex}
        onChange={(e) => setCurrentMonthIndex(Number(e.target.value))}
        className="min-h-11 rounded-lg border-2 border-[#9c7560] bg-white px-2 text-sm font-bold text-[#54433d]"
      >
        {MONTHS.map((m, idx) => (
          <option key={m.key} value={idx} disabled={idx < currentCalendarMonth}>
            {m.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={handleNextMonth}
        disabled={currentMonthIndex >= MONTHS.length - 1}
        aria-label="Mois suivant"
        className="flex h-11 w-11 items-center justify-center rounded-lg font-bold text-[#5a473d] hover:bg-white focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#5b473d] disabled:cursor-not-allowed disabled:text-[#8a8a8a]"
      >
        <span aria-hidden="true">→</span>
      </button>
    </div>
  );

  const saveButton = (
    <button
      type="button"
      onClick={handleSaveBudget}
      disabled={isSavingBudget || isPastMonth || dataGroups.length === 0}
      className="min-h-11 rounded-xl border-2 border-[#6e8f72] bg-[#7fa984] px-4 text-sm font-bold text-[#17301c] shadow-[0_3px_0_rgba(69,105,74,0.8)] transition-transform hover:translate-y-[1px] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#5b473d] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isSavingBudget ? 'Enregistrement...' : 'Valider budget'}
    </button>
  );

  return (
    <ScreenCard
      flow
      title="Budget mensuel" icon="💰"
      subtitle={isPastMonth ? 'Mois passé : lecture seule.' : `Prévois ${activeMonth.label.toLowerCase()} bloc par bloc.`}
      actions={
        <>
          {monthControls}
          {saveButton}
        </>
      }
    >
      {!isLoaded ? (
        <p role="status" className="py-6 text-center font-semibold">Chargement...</p>
      ) : (
        <div className="flex flex-col gap-1 md:h-full md:min-h-0">
          {!isPastMonth && (
            <div className="flex shrink-0 flex-wrap items-center justify-center gap-2 py-1">
              <button
                type="button"
                onClick={handleSuggest}
                disabled={isSuggesting || dataGroups.length === 0}
                className="min-h-11 rounded-xl border-2 border-[#d8b7a5] bg-[#fff8f2] px-4 text-sm font-bold text-[#5a473d] transition hover:bg-[#F8D5CB] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#5b473d] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span aria-hidden="true">✨ </span>
                {isSuggesting ? 'Je regarde ton relevé…' : 'Proposer d’après mes dépenses réelles'}
              </button>
              {suggestionMessage && (
                <p className="basis-full text-center text-sm font-semibold text-[#5a473d]" role="status">{suggestionMessage}</p>
              )}
            </div>
          )}
          {budgetSaveMessage && (
            <p className="shrink-0 text-sm font-semibold text-[#1f4d25]" role="status">{budgetSaveMessage}</p>
          )}
          {budgetSaveError && (
            <p className="shrink-0 text-sm font-semibold text-[#9c3633]" role="alert">{budgetSaveError}</p>
          )}
          <SectionStack
            label="Parties du budget du mois"
            sections={[
              ...dataGroups.map((group) => ({
                id: group.key,
                label: group.title,
                hideTitle: true,
                content: (
                  <BudgetGroupTable
                    group={group}
                    monthIndex={currentMonthIndex}
                    monthLabel={activeMonth.label}
                    readOnly={isPastMonth}
                    onUpdateAmount={handleUpdateAmount}
                  />
                ),
              })),
              {
                id: 'add',
                label: 'Ajouter une ligne',
                content: (
                  <FormBilan
                    groups={dataGroups}
                    monthIndex={currentMonthIndex}
                    onAddRow={handleAddRow}
                    readOnly={isPastMonth}
                  />
                ),
              },
              {
                id: 'totals',
                label: 'Totaux',
                hideTitle: true,
                content: (
                  <BudgetTotalsSection
                    dataGroups={dataGroups}
                    currentMode={currentMode}
                    currentMonthIndex={currentMonthIndex}
                    currentMonthLabel={activeMonth.label}
                  />
                ),
              },
              {
                id: 'chart',
                label: 'Graphique',
                hideTitle: true,
                content: (
                  <BudgetDonut dataGroups={dataGroups} monthIndex={currentMonthIndex} monthLabel={activeMonth.label} />
                ),
              },
            ]}
          />
        </div>
      )}
    </ScreenCard>
  );
}
