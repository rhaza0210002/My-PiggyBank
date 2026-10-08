"use client";

import BudgetDonut from '@/components/features/charts/AnnualBudgetDonut';
import BudgetTotalsSection from '@/components/features/tables/BudgetTableSection';
import { MONTHS, TABLE_STYLES } from '@/constants/tableStyles';
import { BUDGET_MODES } from '@/constants/budgetTypes';
import { getBudgetGroupPalette } from '@/constants/budgetGroupPalette';
import { formatCurrency } from '@/utils/budgetCalculations';
import ScreenCard from '@/components/ui/ScreenCard';
import Tabs from '@/components/ui/Tabs';
import { useBudget } from '@/hooks/useBudget';
import type { DataGroup } from '@/types/budget';

export default function BilanBank() {
  const { dataGroups, isLoaded } = useBudget();

  return (
    <ScreenCard title="Budget annuel" icon="📅" subtitle="Vue des 12 mois, un bloc à la fois.">
      {!isLoaded ? (
        <p role="status" className="py-6 text-center font-semibold">Chargement...</p>
      ) : dataGroups.length === 0 ? (
        <p className="py-6 text-center font-semibold">Aucun groupe de budget trouvé.</p>
      ) : (
        <Tabs
          label="Blocs du budget annuel"
          tabs={[
            ...dataGroups.map((group) => ({
              id: group.key,
              label: group.title,
              content: <BudgetAnnualGroupTable group={group} />,
            })),
            {
              id: 'totals',
              label: 'Totaux',
              content: (
                <BudgetTotalsSection
                  dataGroups={dataGroups}
                  currentMode={BUDGET_MODES.ANNUEL}
                  currentMonthIndex={0}
                  currentMonthLabel=""
                />
              ),
            },
            { id: 'chart', label: 'Graphique', content: <BudgetDonut dataGroups={dataGroups} /> },
          ]}
        />
      )}
    </ScreenCard>
  );
}

function BudgetAnnualGroupTable({ group }: { group: DataGroup }) {
  const palette = getBudgetGroupPalette(group.key, group.title);

  return (
    <div className={`rounded-[2rem] border-[3px] border-dashed ${palette.border} ${palette.section} p-3 shadow-[0_3px_0_rgba(140,103,86,0.12)]`}>
      <h2 className="mb-2 px-2 text-center text-[clamp(1rem,1.5vw,1.25rem)] font-black tracking-[-0.05em] text-[#5d4d44]">
        {group.title}
      </h2>

      <div role="region" aria-label={`Tableau annuel ${group.title}`} tabIndex={0} className={`overflow-x-auto rounded-xl border ${palette.border} ${palette.table} shadow-inner`}>
        <table
          className="w-full min-w-[840px] border-collapse text-left"
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
                <td colSpan={MONTHS.length + 1} className="py-6 text-center text-[1.1rem] italic text-[#6b574c]">
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