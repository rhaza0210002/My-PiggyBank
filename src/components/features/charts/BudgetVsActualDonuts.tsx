"use client";

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { getBudgetEntries, type BudgetEntry } from '@/services/budgetService';
import type { Category, CategoryGroup } from '@/services/transactionCategoryService';
import type { StoredTransaction } from '@/services/transactionService';
import { playWhenVisible } from '@/utils/playWhenVisible';
import { euroFormatter } from '@/utils/formatEuro';
import { buildBudgetVsActualSlices, type BudgetVsActualSlice } from '@/utils/budgetVsActual';
import { createArcPath } from '@/utils/donutGeometry';
import EmptyState from '@/components/ui/EmptyState';

interface BudgetVsActualDonutsProps {
  year: number;
  monthIndex: number;
  monthLabel: string;
  transactions: StoredTransaction[];
  categories: Category[];
  categoryGroups: CategoryGroup[];
}

type DonutKind = 'budget' | 'actual';

interface Arc {
  categoryId: string;
  color: string;
  path: string;
}

/** Couleurs assez soutenues pour rester lisibles (3:1) sur le fond crème ; la légende donne aussi les montants. */
const CATEGORY_COLORS = [
  '#b5513a',
  '#8a6d1f',
  '#3f7f66',
  '#3f6e93',
  '#8a5a82',
  '#6b7a35',
  '#b0476b',
  '#2f7f86',
  '#8c5a2b',
  '#5f5fa3',
];

const DONUTS: { kind: DonutKind; title: string }[] = [
  { kind: 'budget', title: 'Budget estimé' },
  { kind: 'actual', title: 'Dépenses réelles' },
];

const STEP_SECONDS = 0.55;

function buildArcs(slices: BudgetVsActualSlice[], kind: DonutKind): { arcs: Arc[]; total: number } {
  const total = slices.reduce((sum, slice) => sum + slice[kind], 0);
  let startShare = 0;

  const arcs = slices.flatMap((slice, index): Arc[] => {
    const share = total > 0 ? (slice[kind] / total) * 100 : 0;
    if (share <= 0) return [];
    const arc = {
      categoryId: slice.categoryId,
      color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
      path: createArcPath(startShare, share),
    };
    startShare += share;
    return [arc];
  });

  return { arcs, total };
}

function describeGap(slice: BudgetVsActualSlice): string {
  const gap = slice.budget - slice.actual;
  if (slice.budget === 0) return 'Hors budget';
  if (Math.abs(gap) < 0.005) return 'Pile dans le budget';
  return gap > 0 ? `${euroFormatter.format(gap)} sous le budget` : `${euroFormatter.format(-gap)} de dépassement`;
}

export default function BudgetVsActualDonuts({
  year,
  monthIndex,
  monthLabel,
  transactions,
  categories,
  categoryGroups,
}: BudgetVsActualDonutsProps) {
  const titleId = useId();
  const sectionRef = useRef<HTMLElement>(null);
  const [budgetEntries, setBudgetEntries] = useState<BudgetEntry[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;

    getBudgetEntries(year)
      .then((entries) => {
        if (isCurrent) setBudgetEntries(entries);
      })
      .catch((error: unknown) => {
        if (!isCurrent) return;
        setLoadError(error instanceof Error ? error.message : 'Impossible de charger le budget estimé.');
      });

    return () => {
      isCurrent = false;
    };
  }, [year]);

  const slices = useMemo(
    () =>
      budgetEntries
        ? buildBudgetVsActualSlices(monthIndex, budgetEntries, transactions, categories, categoryGroups)
        : [],
    [budgetEntries, monthIndex, transactions, categories, categoryGroups],
  );
  const donuts = useMemo(
    () => DONUTS.map((donut) => ({ ...donut, ...buildArcs(slices, donut.kind) })),
    [slices],
  );
  const [budgetTotal, actualTotal] = donuts.map((donut) => donut.total);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || slices.length === 0) return;

    const arcElements = (index: number) =>
      section.querySelectorAll<SVGPathElement>(`[data-arc-index="${index}"]`);
    const rows = section.querySelectorAll<HTMLElement>('[data-row-index]');
    const totalElements = section.querySelectorAll<HTMLElement>('[data-total]');
    const finalTotals = { budget: budgetTotal, actual: actualTotal };

    const showTotals = (totals: { budget: number; actual: number }) => {
      totalElements.forEach((element) => {
        element.textContent = euroFormatter.format(totals[element.dataset.total as DonutKind]);
      });
    };

    // GSAP n'est chargé qu'au moment d'animer : il ne pèse pas sur les pages sans graphique.
    let isCancelled = false;
    let revert: (() => void) | undefined;
    let stopWatching: (() => void) | undefined;

    void import('gsap').then(({ gsap }) => {
      if (isCancelled) return;

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        gsap.set(section.querySelectorAll('[data-arc-index]'), { strokeDashoffset: 0 });
        gsap.set(rows, { autoAlpha: 1, x: 0 });
        showTotals(finalTotals);
        return;
      }

      const context = gsap.context(() => {
        const running = { budget: 0, actual: 0 };
        showTotals(running);
        gsap.set(section.querySelectorAll('[data-arc-index]'), { strokeDashoffset: 100 });
        gsap.set(rows, { autoAlpha: 0, x: 16 });

        // En pause : l'animation ne démarre que lorsque le graphique est visible à l'écran.
        const timeline = gsap.timeline({ defaults: { ease: 'power2.out' }, delay: 0.2, paused: true });
        stopWatching = playWhenVisible(section, () => timeline.play());

        slices.forEach((slice, index) => {
          const at = index * STEP_SECONDS;

          timeline.to(arcElements(index), { strokeDashoffset: 0, duration: STEP_SECONDS * 1.4 }, at);
          timeline.to(
            section.querySelector(`[data-row-index="${index}"]`),
            { autoAlpha: 1, x: 0, duration: 0.4 },
            at,
          );
          timeline.to(
            running,
            {
              budget: running.budget + slice.budget,
              actual: running.actual + slice.actual,
              duration: STEP_SECONDS * 1.4,
              onUpdate: () => showTotals(running),
            },
            at,
          );
        });

        timeline.add(() => showTotals(finalTotals));
      }, section);
      revert = () => context.revert();
    });

    return () => {
      isCancelled = true;
      stopWatching?.();
      revert?.();
      showTotals(finalTotals);
    };
  }, [slices, budgetTotal, actualTotal]);

  return (
    <section
      ref={sectionRef}
      aria-labelledby={titleId}
      className="carte-vivante overflow-hidden rounded-carte border-2 border-bordure bg-gradient-to-br from-surface to-surface-douce p-3 shadow-bonbon sm:p-4"
    >
      <div className="mb-2 text-center">
        <h2 id={titleId} className="text-base font-black text-[#5d4d44] sm:text-lg">
          Budget estimé et dépenses réelles — {monthLabel} {year}
        </h2>
      </div>

      {loadError && (
        <p role="alert" className="rounded-lg border-[1.5px] border-depasse bg-depasse-fond p-3 text-sm font-semibold text-depasse">
          {loadError}
        </p>
      )}

      {!loadError && !budgetEntries && (
        <p role="status" className="py-6 text-center text-sm font-semibold text-[#6b574c]">
          Chargement du budget estimé…
        </p>
      )}

      {budgetEntries && slices.length === 0 && (
        <EmptyState
          title={`Rien à comparer pour ${monthLabel.toLowerCase()} ${year}`}
          text="Prévois ton budget ou range tes opérations : la comparaison apparaîtra ici."
        />
      )}

      {slices.length > 0 && (
        <div className="grid items-start gap-3 lg:grid-cols-[auto_minmax(0,1fr)]">
          <div className="grid grid-cols-2 gap-3">
            {donuts.map((donut) => (
              <figure key={donut.kind} className="flex flex-col items-center gap-1">
                <figcaption className="text-sm font-black text-[#5d4d44]">{donut.title}</figcaption>
                <div
                  className="relative aspect-square w-32 max-w-full sm:w-40"
                  role="img"
                  aria-label={`${donut.title} : ${euroFormatter.format(donut.total)} répartis sur ${donut.arcs.length} catégorie${donut.arcs.length > 1 ? 's' : ''}. Le détail est dans le tableau ci-dessous.`}
                >
                  <svg viewBox="0 0 220 220" className="absolute inset-0 h-full w-full" aria-hidden="true">
                    <circle cx="110" cy="110" r="82" fill="none" stroke="#e5ddd5" strokeWidth="28" />
                    {donut.arcs.map((arc) => (
                      <path
                        key={arc.categoryId}
                        data-arc-index={slices.findIndex((slice) => slice.categoryId === arc.categoryId)}
                        d={arc.path}
                        pathLength="100"
                        fill="none"
                        stroke={arc.color}
                        strokeWidth="28"
                        strokeDasharray="100"
                        strokeDashoffset="100"
                      />
                    ))}
                  </svg>
                  <div className="absolute inset-[18%] flex flex-col items-center justify-center rounded-full border-[1.5px] border-[#d8b6a5]/60 bg-[#fbf2e9] px-2 text-center shadow-inner">
                    <span className="text-xs font-bold uppercase text-[#6b574c]">Total</span>
                    <span data-total={donut.kind} className="text-xs font-black text-[#5d4d44] sm:text-sm">
                      {euroFormatter.format(donut.total)}
                    </span>
                  </div>
                </div>
              </figure>
            ))}
          </div>

          <div className="max-h-64 overflow-auto rounded-xl border-[1.5px] border-[#d8b6a5]/60 bg-surface/55 lg:max-h-72" role="region" aria-label="Détail par catégorie" tabIndex={0}>
            <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
              <caption className="sr-only">
                Budget estimé et dépenses réelles par catégorie pour {monthLabel} {year}
              </caption>
              <thead>
                <tr className="border-b border-[#d8b6a5]/60 text-xs uppercase text-[#6b574c]">
                  <th scope="col" className="px-3 py-2 font-bold">Catégorie</th>
                  <th scope="col" className="px-3 py-2 text-right font-bold">Estimé</th>
                  <th scope="col" className="px-3 py-2 text-right font-bold">Réel</th>
                  <th scope="col" className="px-3 py-2 font-bold">Écart</th>
                </tr>
              </thead>
              <tbody>
                {slices.map((slice, index) => (
                  <tr key={slice.categoryId} data-row-index={index} style={{ opacity: 0 }} className="border-b border-[#d8b6a5]/30 last:border-0">
                    <th scope="row" className="px-3 py-2 font-bold text-[#5a473d]">
                      <span className="flex items-center gap-2">
                        <span
                          className="h-3 w-3 shrink-0 rounded-sm"
                          style={{ backgroundColor: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }}
                          aria-hidden="true"
                        />
                        {slice.label}
                      </span>
                    </th>
                    <td className="px-3 py-2 text-right font-semibold text-[#5d4d44]">{euroFormatter.format(slice.budget)}</td>
                    <td className="px-3 py-2 text-right font-semibold text-[#5d4d44]">{euroFormatter.format(slice.actual)}</td>
                    <td className="px-3 py-2 font-semibold text-[#5d4d44]">{describeGap(slice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
