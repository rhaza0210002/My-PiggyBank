"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import BudgetTotalsSection from '@/components/features/tables/BudgetTableSection';
import { MONTHS, TABLE_STYLES } from '@/constants/tableStyles';
import { BUDGET_MODES } from '@/constants/budgetTypes';
import { formatCurrency } from '@/utils/budgetCalculations';

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

const emptyDataGroups: DataGroup[] = [
  {
    title: 'Décaissement services',
    key: 'decaissement',
    rows: [],
    accent: 'bg-[#f0d8c8]',
  },
  {
    title: 'Réserve de frais',
    key: 'reserve',
    rows: [],
    accent: 'bg-[#e5f0d9]',
  },
  {
    title: 'Revenus',
    key: 'revenus',
    rows: [],
    accent: 'bg-[#dfeaf7]',
  },
];

const chartPalette = ['#e7b5a5', '#f0d77c', '#86bcb1', '#d6a5e6', '#9ebf7f', '#f2c6a6'];

export default function BilanBank() {
  const [dataGroups] = useState<DataGroup[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('bilanAnnualData');
      return saved ? JSON.parse(saved) : emptyDataGroups;
    }
    return emptyDataGroups;
  });

  useEffect(() => {
    localStorage.setItem('bilanAnnualData', JSON.stringify(dataGroups));
  }, [dataGroups]);

  return (
    <div className="min-h-screen bg-[#ebcfc6] px-4 py-6 text-[#5b473d] sm:px-6 lg:px-10">

      {/* Bouton de navigation vers le détail mensuel */}
      <div className="flex justify-center mb-6">
        <Link
          href="/budgetmensual"
          className="w-full max-w-[360px] rounded-[1.75rem] border-[3px] border-[#e4a58f] bg-[#e59a86] px-6 py-4 text-center text-[clamp(1.2rem,2vw,1.6rem)] font-black text-[#fff8f5] shadow-[0_6px_0_rgba(171,98,77,0.85)] transition-transform hover:translate-y-[2px] hover:shadow-[0_4px_0_rgba(171,98,77,0.85)]"
        >
          Voir le détail Bilan mensuel
        </Link>
      </div>

      <div className="mx-auto max-w-[1200px] rounded-[2.2rem] border-[3px] border-[#d8b6a5] bg-[#f2e6d8] p-4 shadow-[inset_0_0_0_3px_rgba(255,255,255,0.18)] sm:p-5 space-y-6">

        {/* Affichage des tableaux annuels par groupe */}
        <div className="space-y-6">
          {dataGroups.map((group) => (
            <div key={group.key} className="rounded-[2rem] border-[3px] border-[#d7b59d] border-dashed bg-[#f5eadf] p-3 shadow-[0_3px_0_rgba(140,103,86,0.12)]">
              <h3 className="mb-4 px-2 text-[clamp(1.4rem,2vw,2.2rem)] font-black tracking-[-0.05em] text-[#5d4d44]">
                {group.title}
              </h3>

              <div className="overflow-x-auto rounded-xl border border-[#d8b7a5]/50 bg-white/40 shadow-inner">
                <table className="w-full min-w-[840px] border-collapse text-left" role="region" aria-label={`Tableau de ${group.title}`}>
                  <thead>
                    <tr className={`${group.accent} text-[#5a473d]`}>
                      <th scope="col" className={TABLE_STYLES.thCategory}>Catégorie</th>
                      {MONTHS.map((month) => (
                        <th key={month.key} scope="col" className={TABLE_STYLES.thAmount}>
                          {month.label}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {group.rows.length === 0 ? (
                      <tr>
                        <td colSpan={MONTHS.length + 1} className="py-6 text-center text-[1.1rem] italic text-[#8c7366]">
                          Aucune donnée enregistrée pour le moment.
                        </td>
                      </tr>
                    ) : (
                      group.rows.map((row, index) => (
                        <tr key={`${group.key}-${row.category}-${index}`} className={index % 2 === 0 ? TABLE_STYLES.rowEven : TABLE_STYLES.rowOdd}>
                          <td className={TABLE_STYLES.cellCategory}>
                            {row.category}
                          </td>

                          {row.values.map((value, monthIndex) => (
                            <td key={`${row.category}-${monthIndex}`} className={TABLE_STYLES.cellAmount}>
                              {value === '-' || value === 0 ? '—' : formatCurrency(value)}
                            </td>
                          ))}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>

        {/* Section récapitulative des totaux mutualisée */}
        <div>
          <BudgetTotalsSection
            dataGroups={dataGroups}
            currentMode={BUDGET_MODES.ANNUEL}
            currentMonthIndex={0}
            currentMonthLabel=""
          />
        </div>

        {/* Graphique / Palette */}
        <div className="flex flex-col items-center justify-between gap-4 rounded-[2rem] border-[3px] border-[#d8b7a5] bg-[#f5eadf] p-4 sm:flex-row">
          <div className="flex w-full items-center justify-center sm:w-auto">
            <div
              className="relative h-24 w-24 rounded-full shadow-[inset_0_0_0_8px_rgba(255,255,255,0.2)]"
              style={{
                background: `conic-gradient(${chartPalette[0]} 0 100%)`,
              }}
            >
              <div className="absolute inset-[18%] rounded-full bg-[#f5eadf]" />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-[1.2rem] font-bold text-[#5a473d]">
            <div className="flex items-center gap-2"><span className="inline-block h-4 w-4 rounded-full bg-[#f0d77c]" />Loyer & Charges</div>
            <div className="flex items-center gap-2"><span className="inline-block h-4 w-4 rounded-full bg-[#82b89f]" />Communication</div>
            <div className="flex items-center gap-2"><span className="inline-block h-4 w-4 rounded-full bg-[#e7b5a5]" />Utilités & Divers</div>
          </div>
        </div>

      </div>
    </div>
  );
}