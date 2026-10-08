"use client";

import { useEffect, useRef } from 'react';
import type { DataGroup } from '@/types/budget';
import { formatCurrency } from '@/utils/budgetCalculations';
import { createArcPath } from '@/utils/donutGeometry';

interface BudgetDonutProps {
  dataGroups: DataGroup[];
  monthIndex?: number;
  monthLabel?: string;
}

interface ChartSlice {
  label: string;
  amount: number;
  color: string;
  share: number;
}

interface ChartSegment extends ChartSlice {
  path: string;
}

const chartColors = [
  '#d8846d',
  '#c7a13d',
  '#5d9b83',
  '#6388a5',
  '#ab7e9e',
  '#829356',
];

function isIncomeGroup(group: DataGroup): boolean {
  const normalizedName = `${group.key} ${group.title}`
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  return normalizedName.includes('revenu') || normalizedName.includes('income');
}

function buildChartSlices(dataGroups: DataGroup[], monthIndex?: number): ChartSlice[] {
  const totalsByCategory = new Map<string, number>();

  dataGroups.filter((group) => !isIncomeGroup(group)).forEach((group) => {
    group.rows.forEach((row) => {
      const amountForPeriod = monthIndex === undefined
        ? row.values.reduce<number>((sum, value) => {
          const amount = Number(value);
          return sum + (Number.isFinite(amount) && amount > 0 ? amount : 0);
        }, 0)
        : Number(row.values[monthIndex]);
      const periodTotal = Number.isFinite(amountForPeriod) && amountForPeriod > 0
        ? amountForPeriod
        : 0;

      if (periodTotal > 0) {
        totalsByCategory.set(
          row.category,
          (totalsByCategory.get(row.category) ?? 0) + periodTotal,
        );
      }
    });
  });

  const rankedCategories = [...totalsByCategory.entries()]
    .map(([label, amount]) => ({ label, amount }))
    .sort((first, second) => second.amount - first.amount);
  const visibleCategories = rankedCategories.slice(0, 5);
  const otherAmount = rankedCategories
    .slice(5)
    .reduce((sum, category) => sum + category.amount, 0);

  if (otherAmount > 0) {
    visibleCategories.push({ label: 'Autres', amount: otherAmount });
  }

  const total = visibleCategories.reduce((sum, category) => sum + category.amount, 0);

  return visibleCategories.map((category, index) => ({
    ...category,
    color: chartColors[index % chartColors.length],
    share: (category.amount / total) * 100,
  }));
}

export default function BudgetDonut({
  dataGroups,
  monthIndex,
  monthLabel,
}: BudgetDonutProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const isMonthly = monthIndex !== undefined;
  const chartTitle = isMonthly
    ? `Répartition des dépenses — ${monthLabel ?? ''}`
    : 'Répartition annuelle des dépenses';
  const emptyMessage = isMonthly
    ? `Aucune dépense enregistrée pour ${monthLabel ?? 'ce mois'}.`
    : 'Aucune dépense enregistrée pour cette année.';
  const slices = buildChartSlices(dataGroups, monthIndex);
  const total = slices.reduce((sum, slice) => sum + slice.amount, 0);
  const segments: ChartSegment[] = slices.map((slice, index) => {
    const startShare = slices
      .slice(0, index)
      .reduce((sum, previousSlice) => sum + previousSlice.share, 0);

    return {
      ...slice,
      path: createArcPath(startShare, slice.share),
    };
  });

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    // GSAP n'est chargé qu'au moment d'animer : il ne pèse pas sur les pages sans graphique.
    let isCancelled = false;
    let revert: (() => void) | undefined;

    void Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(([{ gsap }, { ScrollTrigger }]) => {
    if (isCancelled) return;
    const context = gsap.context(() => {
      gsap.registerPlugin(ScrollTrigger);
      const chartSegments = section.querySelectorAll('.chart-segment');
      const prefersReducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches;

      if (prefersReducedMotion) {
        gsap.set('.chart-heading, .chart-donut, .chart-legend-item, .chart-bar', {
          clearProps: 'all',
        });
        gsap.set(chartSegments, { strokeDashoffset: 0, autoAlpha: 1 });
        return;
      }

      const timeline = gsap.timeline({
        defaults: { ease: 'power3.out' },
        scrollTrigger: {
          trigger: section,
          start: 'top 78%',
          once: true,
        },
      });
      const heading = section.querySelector('.chart-heading');
      const donut = section.querySelector('.chart-donut');
      const legendItems = section.querySelectorAll('.chart-legend-item');
      const bars = section.querySelectorAll('.chart-bar');

      if (heading) {
        timeline.fromTo(
          heading,
          { y: 16, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.45 },
        );
      }
      if (donut) {
        timeline.fromTo(
          donut,
          { scale: 0.76, autoAlpha: 0 },
          { scale: 1, autoAlpha: 1, duration: 0.65, ease: 'back.out(1.4)' },
          '-=0.2',
        );
      }
      if (chartSegments.length > 0) {
        timeline.fromTo(
          chartSegments,
          { strokeDashoffset: 100, autoAlpha: 0 },
          { strokeDashoffset: 0, autoAlpha: 1, duration: 0.62, stagger: 0.16, ease: 'power2.out' },
          '-=0.42',
        );
      }
      if (legendItems.length > 0) {
        timeline.fromTo(
          legendItems,
          { x: 18, autoAlpha: 0 },
          { x: 0, autoAlpha: 1, duration: 0.38, stagger: 0.07 },
          '-=0.35',
        );
      }
      if (bars.length > 0) {
        timeline.fromTo(
          bars,
          { scaleX: 0 },
          { scaleX: 1, duration: 0.55, stagger: 0.06, ease: 'power2.out' },
          '-=0.25',
        );
      }
    }, section);
    revert = () => context.revert();
    });

    return () => {
      isCancelled = true;
      revert?.();
    };
  }, [dataGroups, monthIndex, monthLabel]);

  return (
    <section
      ref={sectionRef}
      className="overflow-hidden rounded-[2rem] border-[3px] border-[#d8b6a5] bg-gradient-to-br from-[#fbf2e9] to-[#f2e3d7] p-5 shadow-[0_5px_0_rgba(140,103,86,0.1)] sm:p-7"
      aria-labelledby="budget-chart-title"
    >
      <h2 id="budget-chart-title" className="chart-heading mb-6 text-xl font-black text-[#5d4d44]">
        {chartTitle}
      </h2>
      <div className="grid items-center gap-7 lg:grid-cols-[minmax(13rem,0.8fr)_minmax(0,1.2fr)]">
        <div
          className="chart-donut relative mx-auto aspect-square w-52 max-w-full rounded-full shadow-[0_12px_28px_rgba(110,76,56,0.18)]"
          role="img"
          aria-label={slices.length > 0
            ? `Répartition des dépenses, total ${formatCurrency(total)}`
            : 'Aucune dépense enregistrée'}
        >
          <svg
            viewBox="0 0 220 220"
            className="absolute inset-0 h-full w-full"
            aria-hidden="true"
          >
            <circle
              cx="110"
              cy="110"
              r="82"
              fill="none"
              stroke="#e5ddd5"
              strokeWidth="28"
            />
            {segments.map((segment) => (
              <path
                key={segment.label}
                className="chart-segment"
                d={segment.path}
                pathLength="100"
                fill="none"
                stroke={segment.color}
                strokeWidth="28"
                strokeLinecap="butt"
                strokeDasharray="100"
                strokeDashoffset="100"
              />
            ))}
          </svg>
          <div className="absolute inset-[18%] flex flex-col items-center justify-center rounded-full border border-[#d8b6a5]/60 bg-[#fbf2e9] px-2 text-center shadow-inner">
            <span className="mb-1 text-[0.65rem] font-bold uppercase text-[#6b574c]">
              {isMonthly ? monthLabel : 'Année'}
            </span>
            <span className="text-base font-black text-[#5d4d44] sm:text-lg">
              {slices.length > 0 ? formatCurrency(total) : '—'}
            </span>
          </div>
        </div>

        {slices.length === 0 ? (
          <p className="chart-legend-item rounded-xl border border-dashed border-[#d8b6a5] bg-white/40 p-5 text-center text-sm italic text-[#6b574c]">
            {emptyMessage}
          </p>
        ) : (
          <ul className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
            {slices.map((slice) => (
              <li
                key={slice.label}
                className="chart-legend-item min-w-0 rounded-xl border border-[#d8b6a5]/60 bg-white/55 p-3 shadow-sm"
              >
                <div className="mb-2 flex min-w-0 items-center gap-2">
                  <span
                    className="h-3 w-3 shrink-0 rounded-sm"
                    style={{ backgroundColor: slice.color }}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1 truncate text-sm font-bold text-[#5a473d]" title={slice.label}>
                    {slice.label}
                  </span>
                  <span className="shrink-0 text-xs font-bold text-[#6b574c]">
                    {slice.share.toFixed(1)}%
                  </span>
                </div>
                <div className="mb-1 h-1.5 overflow-hidden rounded-full bg-[#e8ddd4]">
                  <span
                    className="chart-bar block h-full origin-left rounded-full"
                    style={{ width: `${slice.share}%`, backgroundColor: slice.color }}
                  />
                </div>
                <p className="text-right text-sm font-black text-[#5d4d44]">
                  {formatCurrency(slice.amount)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}