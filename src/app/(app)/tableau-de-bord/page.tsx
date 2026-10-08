"use client";

import { useEffect, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import BadgeShelf from '@/components/features/gamification/BadgeShelf';
import MonthsStrip from '@/components/features/gamification/MonthsStrip';
import ProgressBar from '@/components/ui/ProgressBar';
import { ROUTES } from '@/constants/routes';
import { MONTHS } from '@/constants/tableStyles';
import { useGamification } from '@/hooks/useGamification';
import { supabase } from '@/lib/supabaseClient';
import { getMonthTotals, type MonthTotals } from '@/services/transactionService';
import { getUserProfile } from '@/services/userService';
import { euroFormatter, signedEuroFormatter } from '@/utils/formatEuro';
import { pickTip } from '@/utils/tips';

const PANEL = 'items-center text-center rounded-3xl border border-[#e5c4b4] bg-[#fff8f2] p-3 shadow-sm sm:p-4';
const PRIMARY_LINK =
  'inline-flex min-h-12 items-center justify-center rounded-[1.25rem] border-[3px] border-[#e4a58f] bg-[#e59a86] px-5 py-2 text-center font-bold text-[#3d2a21] shadow-[0_4px_0_rgba(171,98,77,0.85)] transition-transform hover:translate-y-[2px] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#5b473d] motion-reduce:transition-none';

export default function DashboardPage() {
  const { data: progress, error: progressError } = useGamification();
  const [pseudo, setPseudo] = useState('');
  const [monthTotals, setMonthTotals] = useState<MonthTotals | null>(null);
  const [tipOffset, setTipOffset] = useState(0);
  const [today] = useState(() => new Date());

  useEffect(() => {
    let isCurrent = true;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const user = session?.user;
      if (!user || !isCurrent) return;
      const fallback = user.email?.split('@')[0] ?? '';
      try {
        const profile = await getUserProfile(user.id);
        if (isCurrent) setPseudo(profile?.pseudo || fallback);
      } catch {
        if (isCurrent) setPseudo(fallback);
      }
    });

    getMonthTotals(today.getFullYear(), today.getMonth())
      .then((totals) => {
        if (isCurrent) setMonthTotals(totals);
      })
      .catch(() => {});

    return () => {
      isCurrent = false;
    };
  }, [today]);

  const tip = pickTip(today, tipOffset);
  const month = progress?.currentMonth;
  const pending = month ? month.total - month.done : 0;
  const level = progress?.levelInfo;
  const monthName = MONTHS[today.getMonth()].label;
  const hasBalance = monthTotals !== null && monthTotals.count > 0;

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-[1200px] flex-col gap-2 overflow-y-auto px-3 py-2 sm:px-5">
      <div className="flex shrink-0 flex-col items-center gap-0.5 px-1 text-center">
        <h1 className="flex items-center gap-2 text-[clamp(1.35rem,2.2vw,1.9rem)] font-black tracking-[-0.04em] text-[#5d4d44]">
          <span aria-hidden="true" className="inline-block motion-safe:animate-[wiggle_2.4s_ease-in-out_infinite]">🐷</span>
          Salut{pseudo ? ` ${pseudo}` : ''} !
        </h1>
        <p className="text-sm text-[#6b574c]">Un petit pas à la fois : chaque pointage compte, rien ne se perd.</p>
      </div>

      {progressError && (
        <p role="alert" className="shrink-0 rounded-lg border border-red-300 bg-red-50 p-3 text-sm font-semibold text-red-800">
          {progressError}
        </p>
      )}

      <div className="grid shrink-0 gap-2 md:grid-cols-12">
        {/* Action du moment : toujours en premier, une seule chose à faire. */}
        <section aria-labelledby="month-title" style={{ '--i': 0 } as CSSProperties} className={`${PANEL} rise flex flex-col gap-2 md:col-span-5`}>
          <h2 id="month-title" className="text-sm font-bold uppercase tracking-[0.15em] text-[#a3452a]">
            {monthName}
          </h2>

          {!month ? (
            <p role="status" className="text-sm font-semibold text-[#6b574c]">Chargement…</p>
          ) : month.total === 0 ? (
            <>
              <p className="text-lg font-bold text-[#5a4d41]">Pas encore d’opérations ce mois-ci.</p>
              <Link href={ROUTES.import} className={PRIMARY_LINK}>Importer mon relevé</Link>
            </>
          ) : pending === 0 ? (
            <>
              <p className="text-lg font-bold text-[#1f4d25]">
                <span aria-hidden="true">🎉 </span>Mois bouclé, bravo !
              </p>
              <ProgressBar value={month.done} max={month.total} label={`Opérations de ${monthName} pointées`} valueText={`${month.done} sur ${month.total}`} />
              <Link href={ROUTES.actualExpenses} className={PRIMARY_LINK}>Voir mes dépenses</Link>
            </>
          ) : (
            <>
              <p className="text-lg font-bold text-[#5a4d41]">
                {pending} opération{pending > 1 ? 's' : ''} à pointer
              </p>
              <ProgressBar
                value={month.done}
                max={month.total}
                label={`Opérations de ${monthName} pointées`}
                valueText={`${month.done} sur ${month.total} opérations pointées`}
              />
              <p className="text-xs text-[#6b574c]">{month.done} sur {month.total} déjà pointées</p>
              <Link href={ROUTES.reconciliation} className={PRIMARY_LINK}>Commencer à pointer</Link>
            </>
          )}

          <p className="mt-auto text-sm text-[#6b574c]">
            Solde du mois :{' '}
            <strong className={hasBalance && monthTotals.net < 0 ? 'text-[#9c3633]' : 'text-[#2f5d32]'}>
              {hasBalance ? signedEuroFormatter.format(monthTotals.net) : '—'}
            </strong>
            {hasBalance && (
              <span className="text-xs"> ({euroFormatter.format(monthTotals.expenses)} dépensés)</span>
            )}
          </p>
        </section>

        <section aria-labelledby="level-title" style={{ '--i': 1 } as CSSProperties} className={`${PANEL} rise flex flex-col gap-2 md:col-span-4`}>
          <h2 id="level-title" className="text-sm font-bold uppercase tracking-[0.15em] text-[#a3452a]">
            Ma progression
          </h2>
          {level && progress ? (
            <>
              <p className="text-lg font-bold text-[#5a4d41]">
                Niveau {level.level} · {level.title}
              </p>
              <ProgressBar
                value={level.xpIntoLevel}
                max={level.xpForNext}
                label="Progression vers le niveau suivant"
                valueText={`${level.xpIntoLevel} points sur ${level.xpForNext}`}
              />
              <p className="text-xs text-[#6b574c]">
                {level.xp} points au total · encore {level.xpForNext - level.xpIntoLevel} pour le niveau {level.level + 1}
              </p>
              <BadgeShelf badges={progress.badges} />
            </>
          ) : (
            <p role="status" className="text-sm font-semibold text-[#6b574c]">Chargement…</p>
          )}
        </section>

        <section aria-labelledby="tip-title" style={{ '--i': 2 } as CSSProperties} className={`${PANEL} rise flex flex-col gap-2 md:col-span-3`}>
          <h2 id="tip-title" className="text-sm font-bold uppercase tracking-[0.15em] text-[#a3452a]">
            Astuce du jour
          </h2>
          <p className="font-bold text-[#5a4d41]">{tip.title}</p>
          <p className="text-sm text-[#5a4d41]">{tip.text}</p>
          <button
            type="button"
            onClick={() => setTipOffset((offset) => offset + 1)}
            className="mt-auto min-h-11 self-center rounded-xl border border-[#b88f78] bg-white/70 px-3 text-sm font-bold text-[#5d4d44] hover:bg-white focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#5b473d]"
          >
            Une autre astuce
          </button>
        </section>
      </div>

      <section aria-labelledby="months-title" style={{ '--i': 3 } as CSSProperties} className={`${PANEL} rise shrink-0`}>
        <div className="mb-2 flex flex-col items-center gap-0.5 text-center">
          <h2 id="months-title" className="text-sm font-bold uppercase tracking-[0.15em] text-[#a3452a]">
            Mon année {today.getFullYear()}
          </h2>
          {progress && (
            <p className="text-xs text-[#6b574c]">
              {progress.completedMonths} mois bouclé{progress.completedMonths > 1 ? 's' : ''} · un mois manqué se rattrape à tout moment
            </p>
          )}
        </div>
        {progress ? <MonthsStrip months={progress.months} /> : <p role="status" className="text-sm text-[#6b574c]">Chargement…</p>}
      </section>
    </div>
  );
}
