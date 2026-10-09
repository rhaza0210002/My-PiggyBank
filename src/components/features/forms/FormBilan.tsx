"use client";

import Button from '@/components/ui/Button';
import React, { useState, FormEvent } from 'react';
import type { DataGroup } from '@/types/budget';

interface FormBilanProps {
  groups: DataGroup[];
  monthIndex: number;
  onAddRow: (data: { groupKey: string; category: string; amount: string; monthIndex: number }) => Promise<void>;
  readOnly?: boolean;
}

export default function FormBilan({
  groups,
  monthIndex,
  onAddRow,
  readOnly = false,
}: FormBilanProps) {
  const currentMonthIndex = new Date().getMonth();

  const [groupKey, setGroupKey] = useState<string>(groups[0]?.key || '');
  const selectedGroupKey = groups.some((group) => group.key === groupKey)
    ? groupKey
    : groups[0]?.key || '';
  const selectedGroup = groups.find((group) => group.key === selectedGroupKey);
  const categorySuggestions = Array.from(
    new Set(selectedGroup?.rows.map((row) => row.category.trim()).filter(Boolean)),
  ).sort((first, second) => first.localeCompare(second, 'fr'));
  const [category, setCategory] = useState<string>('');

  const [amount, setAmount] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (
      readOnly ||
      monthIndex < currentMonthIndex ||
      !category.trim() ||
      !selectedGroupKey ||
      isSubmitting
    ) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await onAddRow({
        groupKey: selectedGroupKey,
        category: category.trim(),
        amount,
        monthIndex,
      });

      setCategory('');
      setAmount('');
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Impossible d'ajouter la catégorie.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-end gap-4 rounded-carte border-[1.5px] border-bordure bg-surface-douce p-4 shadow-sm"
      aria-label="Formulaire d'ajout de transaction"
    >
      <div className="flex flex-1 min-w-[150px] flex-col gap-1">
        <label htmlFor="group-select" className="text-sm font-bold text-texte">
          Groupe
        </label>
        <select
          id="group-select"
          value={selectedGroupKey}
          onChange={(e) => setGroupKey(e.target.value)}
          disabled={readOnly || groups.length === 0}
          aria-label="Sélectionner un groupe"
          className="rounded-xl border-[1.5px] border-bordure-forte bg-surface p-2.5 text-sm font-semibold text-texte outline-none focus:ring-2 focus:ring-focus"
        >
          {groups.map((g) => (
            <option key={g.key} value={g.key}>
              {g.title}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-1 min-w-[180px] flex-col gap-1">
        <label htmlFor="category-input" className="text-sm font-bold text-texte">
          Catégorie
        </label>
        <input
          id="category-input"
          type="text"
          list="category-suggestions"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Ex: Électricité"
          required
          disabled={readOnly}
          aria-required="true"
          aria-invalid={submitError !== null}
          className="rounded-xl border-[1.5px] border-bordure-forte bg-surface p-2.5 text-sm font-semibold text-texte outline-none focus:ring-2 focus:ring-focus"
        />
        <datalist id="category-suggestions">
          {categorySuggestions.map((suggestion) => (
            <option key={suggestion} value={suggestion} />
          ))}
        </datalist>
      </div>

      <div className="flex flex-1 min-w-[120px] flex-col gap-1">
        <label htmlFor="amount-input" className="text-sm font-bold text-texte">
          Montant (€)
        </label>
        <input
          id="amount-input"
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          disabled={readOnly}
          aria-label="Montant en euros"
          className="rounded-xl border-[1.5px] border-bordure-forte bg-surface p-2.5 text-sm font-semibold text-texte outline-none focus:ring-2 focus:ring-focus"
        />
      </div>

      <Button type="submit" disabled={readOnly || groups.length === 0 || isSubmitting}>
        {isSubmitting ? 'Ajout en cours...' : 'Ajouter la ligne'}
      </Button>
      {submitError && (
        <p className="w-full text-sm font-semibold text-depasse" role="alert">
          {submitError}
        </p>
      )}
    </form>
  );
}

