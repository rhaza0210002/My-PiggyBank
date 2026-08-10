"use client";

import React, { useState, FormEvent } from 'react';

interface MonthItem {
  readonly label: string;
  readonly key: string;
}

interface RowData {
  category: string;
  values: (number | string)[];
}

interface DataGroup {
  title: string;
  key: string;
  rows: RowData[];
  accent: string;
}

interface FormBilanProps {
  groups: DataGroup[];
  months: readonly MonthItem[];
  onAddRow: (data: { groupKey: string; category: string; amount: string; monthIndex: number }) => void;
}

export default function FormBilan({ groups, months, onAddRow }: FormBilanProps) {
  const currentMonthIndex = new Date().getMonth();

  const [groupKey, setGroupKey] = useState<string>(groups[0]?.key || 'decaissement');
  const [category, setCategory] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [monthIndex, setMonthIndex] = useState<number>(currentMonthIndex);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    // Empêche le rechargement par défaut de la page du navigateur
    e.preventDefault();

    if (!category.trim()) return;

    // Envoi des données au composant parent
    onAddRow({
      groupKey,
      category: category.trim(),
      amount,
      monthIndex: Number(monthIndex),
    });

    // Remise à zéro des champs de texte tout en conservant le groupe et le mois sélectionnés
    setCategory('');
    setAmount('');
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-end gap-4 rounded-[1.5rem] border-[2px] border-[#d7b59d] bg-[#f5eadf] p-4 shadow-sm"
    >
      <div className="flex flex-1 min-w-[150px] flex-col gap-1">
        <label htmlFor="group-select" className="text-sm font-bold text-[#5d4d44]">
          Groupe
        </label>
        <select
          id="group-select"
          value={groupKey}
          onChange={(e) => setGroupKey(e.target.value)}
          className="rounded-xl border border-[#d8b7a5] bg-white p-2.5 text-sm font-semibold text-[#54433d] outline-none focus:ring-2 focus:ring-[#e59a86]"
        >
          {groups.map((g) => (
            <option key={g.key} value={g.key}>
              {g.title}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-1 min-w-[180px] flex-col gap-1">
        <label htmlFor="category-input" className="text-sm font-bold text-[#5d4d44]">
          Catégorie
        </label>
        <input
          id="category-input"
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Ex: Électricité"
          required
          className="rounded-xl border border-[#d8b7a5] bg-white p-2.5 text-sm font-semibold text-[#54433d] outline-none focus:ring-2 focus:ring-[#e59a86]"
        />
      </div>

      <div className="flex flex-1 min-w-[120px] flex-col gap-1">
        <label htmlFor="amount-input" className="text-sm font-bold text-[#5d4d44]">
          Montant (€)
        </label>
        <input
          id="amount-input"
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          className="rounded-xl border border-[#d8b7a5] bg-white p-2.5 text-sm font-semibold text-[#54433d] outline-none focus:ring-2 focus:ring-[#e59a86]"
        />
      </div>

      <div className="flex flex-1 min-w-[140px] flex-col gap-1">
        <label htmlFor="month-select" className="text-sm font-bold text-[#5d4d44]">
          Mois
        </label>
        <select
          id="month-select"
          value={monthIndex}
          onChange={(e) => setMonthIndex(Number(e.target.value))}
          className="rounded-xl border border-[#d8b7a5] bg-white p-2.5 text-sm font-semibold text-[#54433d] outline-none focus:ring-2 focus:ring-[#e59a86]"
        >
          {months.map((m, idx) => (
            <option key={m.key} value={idx}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        className="rounded-xl border-2 border-[#e4a58f] bg-[#e59a86] px-5 py-2.5 text-sm font-bold text-white shadow-[0_3px_0_rgba(171,98,77,0.85)] transition-transform active:translate-y-[2px] active:shadow-none"
      >
        Ajouter la ligne
      </button>
    </form>
  );
}