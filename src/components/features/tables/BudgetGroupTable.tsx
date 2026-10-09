"use client";

import { useState, type KeyboardEvent } from 'react';
import { Check, Pencil, X } from 'lucide-react';
import { DataGroup } from '@/types/budget';
import { formatCurrency } from '@/utils/budgetCalculations';
import { TABLE_STYLES } from '@/constants/tableStyles';
import { getGroupHint } from '@/constants/budgetGroupHints';
import { getBudgetGroupPalette } from '@/constants/budgetGroupPalette';
import EmptyState from '@/components/ui/EmptyState';

interface BudgetGroupTableProps {
  group: DataGroup;
  monthIndex: number;
  monthLabel: string;
  readOnly?: boolean;
  onUpdateAmount: (
    groupKey: string,
    category: string,
    monthIndex: number,
    amount: string,
  ) => Promise<void>;
}

export default function BudgetGroupTable({
  group,
  monthIndex,
  monthLabel,
  readOnly = false,
  onUpdateAmount,
}: BudgetGroupTableProps) {
  const palette = getBudgetGroupPalette(group.key, group.title);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [draftAmount, setDraftAmount] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);

  const beginEditing = (category: string, amount: number | string) => {
    setEditingCategory(category);
    setDraftAmount(amount === '-' ? '' : String(amount));
    setSaveError(null);
  };

  const cancelEditing = () => {
    setEditingCategory(null);
    setDraftAmount('');
    setSaveError(null);
  };

  const saveEditing = async (category: string) => {
    try {
      await onUpdateAmount(group.key, category, monthIndex, draftAmount);
      setEditingCategory(null);
      setDraftAmount('');
      setSaveError(null);
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : 'Impossible de modifier ce montant.',
      );
    }
  };

  const handleEditorKeyDown = (
    event: KeyboardEvent<HTMLInputElement>,
    category: string,
  ) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      void saveEditing(category);
    } else if (event.key === 'Escape') {
      cancelEditing();
    }
  };

  return (
    <section className={`rounded-carte sm:rounded-carte border-2 border-dashed ${palette.border} ${palette.section} p-3 sm:p-4 shadow-bonbon`}>
      <h2 className="mb-2 px-2 text-center text-[clamp(1rem,1.5vw,1.25rem)] font-black tracking-[-0.05em] text-texte">
        {group.title} — {monthLabel}
      </h2>
      {getGroupHint(group.key) && (
        <p className="mb-2 px-2 text-center text-xs text-texte-doux">{getGroupHint(group.key)}</p>
      )}

      <div role="region" aria-label={`Tableau ${group.title}`} tabIndex={0} className={`w-full overflow-x-auto rounded-xl border-[1.5px] ${palette.border} ${palette.table} shadow-inner`}>
        <table
          className="w-full min-w-[320px] border-collapse text-left"
          aria-label={`Tableau de ${group.title}`}
        >
          <thead>
            <tr className={`${palette.header} text-texte`}>
              <th scope="col" className={TABLE_STYLES.thCategory}>Catégorie</th>
              <th scope="col" className={TABLE_STYLES.thAmount}>
                Montant ({monthLabel})
              </th>
            </tr>
          </thead>
          <tbody>
            {group.rows.length === 0 ? (
              <tr>
                <td colSpan={2}>
                  <EmptyState compact title="Rien de prévu ici" text="Ajoute une ligne pour ce mois." />
                </td>
              </tr>
            ) : (
              group.rows.map((row, index) => (
                <tr
                  key={`${group.key}-${row.category}-${index}`}
                  className={index % 2 === 0 ? palette.rowEven : palette.rowOdd}
                >
                  <td className={TABLE_STYLES.cellCategory}>{row.category}</td>
                  <td className={`${TABLE_STYLES.cellAmount} group relative`}>
                    {editingCategory === row.category ? (
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="number"
                          step="0.01"
                          autoFocus
                          value={draftAmount}
                          onChange={(event) => setDraftAmount(event.target.value)}
                          onKeyDown={(event) => handleEditorKeyDown(event, row.category)}
                          aria-label={`Modifier le montant de ${row.category}`}
                          className="w-28 rounded-md border-[1.5px] border-bordure-forte bg-surface px-2 py-1 text-right text-sm font-semibold text-texte outline-none focus:ring-2 focus:ring-focus"
                        />
                        <button
                          type="button"
                          onClick={() => void saveEditing(row.category)}
                          title="Valider le montant"
                          aria-label={`Valider le montant de ${row.category}`}
                          className="rounded p-1 text-ok hover:bg-ok-fond focus-visible:outline focus-visible:outline-2 focus-visible:outline-ok"
                        >
                          <Check size={17} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditing}
                          title="Annuler la modification"
                          aria-label={`Annuler la modification de ${row.category}`}
                          className="rounded p-1 text-depasse hover:bg-depasse-fond focus-visible:outline focus-visible:outline-2 focus-visible:outline-depasse"
                        >
                          <X size={17} aria-hidden="true" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <span>{formatCurrency(row.values[monthIndex] ?? '-')}</span>
                        {!readOnly && (
                          <button
                            type="button"
                            onClick={() => beginEditing(row.category, row.values[monthIndex] ?? '-')}
                            title="Modifier le montant"
                            aria-label={`Modifier le montant de ${row.category}`}
                            className="rounded p-1 text-texte-doux opacity-0 transition-opacity hover:bg-surface/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus group-hover:opacity-100 group-focus-within:opacity-100"
                          >
                            <Pencil size={16} aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {saveError && (
        <p className="mt-2 text-sm font-semibold text-depasse" role="alert">
          {saveError}
        </p>
      )}
    </section>
  );
}