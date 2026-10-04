"use client";

import Link from 'next/link';
import BudgetDonut from '@/components/features/charts/AnnualBudgetDonut';
import BudgetTotalsSection from '@/components/features/tables/BudgetTableSection';
import { MONTHS, TABLE_STYLES } from '@/constants/tableStyles';
import { BUDGET_MODES } from '@/constants/budgetTypes';
import { getBudgetGroupPalette } from '@/constants/budgetGroupPalette';
import { formatCurrency } from '@/utils/budgetCalculations';
import { useBudget } from '@/hooks/useBudget';
import type { DataGroup } from '@/types/budget';

export default function BilanBank() {
  const { dataGroups, isLoaded } = useBudget();

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
        {!isLoaded ? (
          <p className="py-6 text-center font-semibold">Chargement...</p>
        ) : dataGroups.length === 0 ? (
          <p className="py-6 text-center font-semibold">Aucun groupe de budget trouvé.</p>
        ) : (
          <div className="space-y-6">
            {dataGroups.map((group) => (
              <BudgetAnnualGroupTable key={group.key} group={group} />
            ))}
          </div>
        )}

        {/* Section récapitulative des totaux mutualisée */}
        <div>
          <BudgetTotalsSection
            dataGroups={dataGroups}
            currentMode={BUDGET_MODES.ANNUEL}
            currentMonthIndex={0}
            currentMonthLabel=""
          />
        </div>

        <BudgetDonut dataGroups={dataGroups} />

      </div>
    </div>
  );
}

function BudgetAnnualGroupTable({ group }: { group: DataGroup }) {
  const palette = getBudgetGroupPalette(group.key, group.title);

  return (
    <div className={`rounded-[2rem] border-[3px] border-dashed ${palette.border} ${palette.section} p-3 shadow-[0_3px_0_rgba(140,103,86,0.12)]`}>
      <h3 className="mb-4 px-2 text-[clamp(1.4rem,2vw,2.2rem)] font-black tracking-[-0.05em] text-[#5d4d44]">
        {group.title}
      </h3>

      <div className={`overflow-x-auto rounded-xl border ${palette.border} ${palette.table} shadow-inner`}>
        <table
          className="w-full min-w-[840px] border-collapse text-left"
          role="region"
          aria-label={`Tableau de ${group.title}`}
        >
          <thead>
            <tr className={`${palette.header} text-[#5a473d]`}>
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
                <tr
                  key={`${group.key}-${row.category}-${index}`}
                  className={index % 2 === 0 ? palette.rowEven : palette.rowOdd}
                >
                  <td className={TABLE_STYLES.cellCategory}>{row.category}</td>
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
  );
}