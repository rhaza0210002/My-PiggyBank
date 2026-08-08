"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

const MONTHS = [
  { label: 'Janvier', key: 'janvier' },
  { label: 'Février', key: 'fevrier' },
  { label: 'Mars', key: 'mars' },
  { label: 'Avril', key: 'avril' },
  { label: 'Mai', key: 'mai' },
  { label: 'Juin', key: 'juin' },
  { label: 'Juillet', key: 'juillet' },
  { label: 'Août', key: 'aout' },
  { label: 'Septembre', key: 'septembre' },
  { label: 'Octobre', key: 'octobre' },
  { label: 'Novembre', key: 'novembre' },
  { label: 'Décembre', key: 'decembre' },
] as const;

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
  const [dataGroups, setDataGroups] = useState<DataGroup[]>(() => {
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

      {/* Bouton de navigation vers le détail mensuel placé en haut */}
      <div className="flex justify-center mb-6">
        <Link
          href="/monthbudget"
          className="w-full max-w-[360px] rounded-[1.75rem] border-[3px] border-[#e4a58f] bg-[#e59a86] px-6 py-4 text-center text-[clamp(1.2rem,2vw,1.6rem)] font-black text-[#fff8f5] shadow-[0_6px_0_rgba(171,98,77,0.85)] transition-transform hover:translate-y-[2px] hover:shadow-[0_4px_0_rgba(171,98,77,0.85)]"
        >
          Voir le détail Bilan mensuel
        </Link>
      </div>

      <div className="mx-auto max-w-[1200px] rounded-[2.2rem] border-[3px] border-[#d8b6a5] bg-[#f2e6d8] p-4 shadow-[inset_0_0_0_3px_rgba(255,255,255,0.18)] sm:p-5">

        <div className="space-y-6">
          {dataGroups.map((group) => (
            <div key={group.key} className="rounded-[2rem] border-[3px] border-[#d7b59d] border-dashed bg-[#f5eadf] p-3 shadow-[0_3px_0_rgba(140,103,86,0.12)]">
              <h3 className="mb-4 px-2 text-[clamp(1.4rem,2vw,2.2rem)] font-black tracking-[-0.05em] text-[#5d4d44]">
                {group.title}
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[840px] border-collapse text-left">
                  <thead>
                    <tr className={`${group.accent} text-[#5a473d]`}>
                      <th className="border-r border-[#d8b7a5] px-4 py-4 text-left text-[1.1rem] font-bold">Catégorie</th>
                      {MONTHS.map((month) => (
                        <th key={month.key} className="border-r border-[#d8b7a5] px-2 py-4 text-center text-[1.05rem] font-bold last:border-r-0">
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
                        <tr key={`${group.key}-${row.category}-${index}`} className={index % 2 === 0 ? 'bg-[#f7e8df]' : 'bg-[#e5f0d9]'}>
                          <td className="border-r border-[#d8b7a5] border-t border-[#d8b7a5] px-4 py-4 text-[1.1rem] font-semibold text-[#54433d]">
                            {row.category}
                          </td>

                          {row.values.map((value, monthIndex) => (
                            <td key={`${row.category}-${monthIndex}`} className="border-r border-[#d8b7a5] border-t border-[#d8b7a5] px-2 py-4 text-center text-[1rem] font-semibold text-[#4a3d37] last:border-r-0">
                              {value === '-' || value === 0 ? '—' : `${Number(value).toFixed(2).replace('.', ',')} €`}
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
        <div className="mt-6 rounded-[2rem] border-[3px] border-[#d7b59d] border-dashed bg-[#f5eadf] p-3 shadow-[0_3px_0_rgba(140,103,86,0.12)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[840px] border-collapse text-left">
              <thead>
                <tr className="bg-[#f0d8c8] text-[#5a473d]">
                  <th className="border-r border-[#d8b7a5] px-4 py-4 text-left text-[1.1rem] font-bold">Totaux</th>
                  {MONTHS.map((month) => (
                    <th key={month.key} className="border-r border-[#d8b7a5] px-2 py-4 text-center text-[1.05rem] font-bold last:border-r-0">
                      {month.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="bg-[#f7e8df]">
                  <td className="border-r border-[#d8b7a5] border-t border-[#d8b7a5] px-4 py-4 text-[1.1rem] font-semibold text-[#54433d]">Dépenses</td>
                  {MONTHS.map((month) => (
                    <td key={`dep-${month.key}`} className="border-r border-[#d8b7a5] border-t border-[#d8b7a5] px-2 py-4 text-center text-[1rem] font-semibold text-[#4a3d37] last:border-r-0">
                      0 €
                    </td>
                  ))}
                </tr>
                <tr className="bg-[#e5f0d9]">
                  <td className="border-r border-[#d8b7a5] border-t border-[#d8b7a5] px-4 py-4 text-[1.1rem] font-semibold text-[#54433d]">Réserves</td>
                  {MONTHS.map((month) => (
                    <td key={`res-${month.key}`} className="border-r border-[#d8b7a5] border-t border-[#d8b7a5] px-2 py-4 text-center text-[1rem] font-semibold text-[#4a3d37] last:border-r-0">
                      0 €
                    </td>
                  ))}
                </tr>
                <tr className="bg-[#dfeaf7] font-bold">
                  <td className="border-r border-[#d8b7a5] border-t border-[#d8b7a5] px-4 py-4 text-[1.1rem] text-[#54433d]">Revenus</td>
                  {MONTHS.map((month) => (
                    <td key={`rev-${month.key}`} className="border-r border-[#d8b7a5] border-t border-[#d8b7a5] px-2 py-4 text-center text-[1rem] text-[#4a3d37] last:border-r-0">
                      0 €
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 flex flex-col items-center justify-between gap-4 rounded-[2rem] border-[3px] border-[#d8b7a5] bg-[#f5eadf] p-4 sm:flex-row">
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