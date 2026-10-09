"use client";

import BudgetDonut from '@/components/features/charts/AnnualBudgetDonut';
import BudgetTotalsSection from '@/components/features/tables/BudgetTableSection';
import { MONTHS, TABLE_STYLES } from '@/constants/tableStyles';
import { BUDGET_MODES } from '@/constants/budgetTypes';
import { getBudgetGroupPalette } from '@/constants/budgetGroupPalette';
import { formatCurrency } from '@/utils/budgetCalculations';
import ScreenCard from '@/components/ui/ScreenCard';
import SectionStack from '@/components/ui/SectionStack';
import { useBudget } from '@/hooks/useBudget';
import type { DataGroup } from '@/types/budget';
import { ROUTES } from '@/constants/routes';
import EmptyState from '@/components/ui/EmptyState';

export default function BilanBank() {
  const { dataGroups, isLoaded } = useBudget();

  return (
    <ScreenCard flow title="Budget annuel" icon="calendar" subtitle="Vue des 12 mois, un bloc à la fois.">
      {!isLoaded ? (
        <p role="status" className="py-6 text-center font-semibold">Chargement...</p>
      ) : dataGroups.length === 0 ? (
        <EmptyState
          title="Pas encore de budget"
          text="Quelques montants suffisent pour commencer."
          action={{ href: ROUTES.budgetMonthly, label: 'Prévoir mon budget' }}
        />
      ) : (
        // Conteneur pleine hauteur : sans lui, la zone de blocs (hauteur de conteneur) s'écrase à zéro sur tablette et ordinateur.
        <div className="flex flex-col md:h-full md:min-h-0">
        <SectionStack
          fillZone
          label="Parties du budget annuel"
          sections={[
            ...dataGroups.map((group) => ({
              id: group.key,
              label: group.title,
              hideTitle: true,
              content: <BudgetAnnualGroupTable group={group} />,
            })),
            {
              id: 'totals',
              label: 'Totaux',
              hideTitle: true,
              content: (
                <BudgetTotalsSection
                  dataGroups={dataGroups}
                  currentMode={BUDGET_MODES.ANNUEL}
                  currentMonthIndex={0}
                  currentMonthLabel=""
                />
              ),
            },
            { id: 'chart', label: 'Graphique', hideTitle: true, content: <BudgetDonut dataGroups={dataGroups} /> },
          ]}
        />
        </div>
      )}
    </ScreenCard>
  );
}

function BudgetAnnualGroupTable({ group }: { group: DataGroup }) {
  const palette = getBudgetGroupPalette(group.key, group.title);

  return (
    <div className={`carte-vivante rounded-carte border-2 border-dashed ${palette.border} ${palette.section} p-3 shadow-bonbon`}>
      <h2 className="mb-2 px-2 text-center text-[clamp(1rem,1.5vw,1.25rem)] font-black tracking-[-0.05em] text-texte">
        {group.title}
      </h2>

      <div role="region" aria-label={`Tableau annuel ${group.title}`} tabIndex={0} className={`overflow-x-auto rounded-xl border-[1.5px] ${palette.border} ${palette.table} shadow-inner`}>
        <table
          className="w-full min-w-[840px] border-collapse text-left"
          aria-label={`Tableau de ${group.title}`}
        >
          <thead>
            <tr className={`${palette.header} text-texte`}>
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
                <td colSpan={MONTHS.length + 1}>
                  <EmptyState compact title="Rien d’enregistré pour l’instant" />
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