"use client";

import { useEffect, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import BadgeShelf from '@/components/features/gamification/BadgeShelf';
import StartChecklist from '@/components/features/gamification/StartChecklist';
import MonthRecapCard from '@/components/features/gamification/MonthRecapCard';
import MonthsStrip from '@/components/features/gamification/MonthsStrip';
import BalanceCard from '@/components/features/dashboard/BalanceCard';
import Pig from '@/components/ui/Pig';
import { useBalanceVisibility } from '@/components/ui/BalanceToggle';
import Gauge from '@/components/ui/Gauge';
import { ROUTES } from '@/constants/routes';
import { MONTHS } from '@/constants/tableStyles';
import { useGamification } from '@/hooks/useGamification';
import { supabase } from '@/lib/supabaseClient';
import { getBudgetEntries } from '@/services/budgetService';
import { getMonthTotals, type MonthTotals } from '@/services/transactionService';
import { getUserProfile } from '@/services/userService';
import { euroFormatter, signedEuroFormatter } from '@/utils/formatEuro';
import { getStartSteps } from '@/utils/startSteps';
import { pickTip } from '@/utils/tips';

const PANEL = 'rounded-carte border-[3px] border-texte p-4 shadow-sticker sm:p-5';
const PRIMARY_LINK =
  'inline-flex min-h-12 items-center justify-center self-start rounded-bonbon border-[3px] border-texte bg-corail px-6 py-2 text-center font-titre text-lg font-extrabold text-sur-corail shadow-bonbon transition-transform hover:translate-y-[2px] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus motion-reduce:transition-none';

export default function DashboardPage() {
  const balance = useBalanceVisibility();
  const { data: progress, error: progressError } = useGamification();
  const [pseudo, setPseudo] = useState('');
  const [monthTotals, setMonthTotals] = useState<MonthTotals | null>(null);
  const [hasBudget, setHasBudget] = useState<boolean | null>(null);
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

    getBudgetEntries(today.getFullYear())
      .then((entries) => {
        if (isCurrent) setHasBudget(entries.length > 0);
      })
      .catch(() => {});

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
  // Les pas ne s'affichent qu'une fois tout chargé, pour ne pas clignoter chez un utilisateur déjà installé.
  const startSteps =
    progress && hasBudget !== null
      ? getStartSteps({
          hasOperations: progress.months.some((m) => m.total > 0),
          hasBudget,
          reconciledOperations: progress.reconciledOperations,
        })
      : null;
  const hasBalance = monthTotals !== null && monthTotals.count > 0;

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-[1200px] flex-col gap-2 overflow-y-auto px-3 py-2 sm:px-5">
      <div className="flex shrink-0 flex-col gap-1 px-2 py-1">
        <h1 className="flex items-center gap-3 text-[clamp(1.75rem,3.4vw,2.75rem)] font-extrabold leading-none tracking-[-0.01em] text-texte">
          <Pig className="size-[1.6em] shrink-0 -rotate-6" />
          <span className="bg-[linear-gradient(transparent_62%,var(--color-piece)_62%)] px-1">Salut{pseudo ? ` ${pseudo}` : ''} !</span>
        </h1>
        <p className="text-base font-semibold text-texte-doux">Un petit pas à la fois : chaque pointage compte, rien ne se perd.</p>
      </div>

      {progressError && (
        <p role="alert" className="shrink-0 rounded-lg border border-depasse bg-depasse-fond p-3 text-sm font-semibold text-depasse">
          {progressError}
        </p>
      )}

      {startSteps && <StartChecklist steps={startSteps} />}

      {month && month.total > 0 && pending === 0 && (
        <MonthRecapCard year={today.getFullYear()} monthIndex={today.getMonth()} isAmountShown={balance.isShown} />
      )}

      <div className="grid shrink-0 gap-2 md:grid-cols-12">
        {/* Action du moment : toujours en premier, une seule chose à faire. */}
        <section aria-labelledby="month-title" style={{ '--i': 0 } as CSSProperties} className={`${PANEL} rise flex flex-col gap-3 bg-accent-doux md:col-span-7`}>
          <h2 id="month-title" className="text-2xl font-extrabold leading-none text-texte">
            {monthName}
          </h2>

          {!month ? (
            <p role="status" className="text-sm font-semibold text-texte-doux">Chargement…</p>
          ) : month.total === 0 ? (
            <>
              <p className="text-lg font-bold text-texte">Pas encore d’opérations ce mois-ci.</p>
              <Link href={ROUTES.import} className={PRIMARY_LINK}>Importer mon relevé</Link>
            </>
          ) : pending === 0 ? (
            <>
              <p className="text-lg font-bold text-ok">
                <span aria-hidden="true">🎉 </span>Mois bouclé, bravo !
              </p>
              <Gauge value={month.done} max={month.total} label={`Opérations de ${monthName} pointées`} valueText={`${month.done} sur ${month.total}`} />
              <Link href={ROUTES.actualExpenses} className={PRIMARY_LINK}>Voir mes dépenses</Link>
            </>
          ) : (
            <>
              <p className="text-lg font-bold text-texte">
                {pending} opération{pending > 1 ? 's' : ''} à pointer
              </p>
              <Gauge
                value={month.done}
                max={month.total}
                label={`Opérations de ${monthName} pointées`}
                valueText={`${month.done} sur ${month.total} opérations pointées`}
              />
              <p className="text-xs text-texte-doux">{month.done} sur {month.total} déjà pointées</p>
              <Link href={ROUTES.reconciliation} className={PRIMARY_LINK}>Commencer à pointer</Link>
            </>
          )}

        </section>

        <BalanceCard
          monthName={monthName}
          isShown={balance.isShown}
          onToggle={balance.toggle}
          amountText={hasBalance ? signedEuroFormatter.format(monthTotals.net) : null}
          detail={hasBalance ? `${euroFormatter.format(monthTotals.expenses)} dépensés` : null}
          negative={hasBalance && monthTotals.net < 0}
          style={{ '--i': 1 } as CSSProperties}
          className="rise md:col-span-5"
        />

        <section aria-labelledby="level-title" style={{ '--i': 2 } as CSSProperties} className={`${PANEL} rise flex flex-col gap-3 bg-corail-clair md:col-span-8`}>
          <h2 id="level-title" className="text-2xl font-extrabold leading-none text-texte">
            Ma progression
          </h2>
          {level && progress ? (
            <>
              <p className="font-titre text-2xl font-extrabold leading-tight text-texte">
                Niveau {level.level} · {level.title}
              </p>
              <Gauge
                value={level.xpIntoLevel}
                max={level.xpForNext}
                label="Progression vers le niveau suivant"
                valueText={`${level.xpIntoLevel} points sur ${level.xpForNext}`}
              />
              <p className="text-xs font-semibold text-texte">
                {level.xp} points au total · encore {level.xpForNext - level.xpIntoLevel} pour le niveau {level.level + 1}
              </p>
              <p className="text-xs font-semibold text-texte">
                <span aria-hidden="true">📅 </span>
                {progress.activeDaysLast7 > 0
                  ? `${progress.activeDaysLast7} jour${progress.activeDaysLast7 > 1 ? 's' : ''} actif${progress.activeDaysLast7 > 1 ? 's' : ''} ces 7 derniers jours`
                  : 'Aucune pression : reprends quand tu veux, rien ne se perd.'}
              </p>
              <BadgeShelf badges={progress.badges} />
            </>
          ) : (
            <p role="status" className="text-sm font-semibold text-texte-doux">Chargement…</p>
          )}
        </section>

        <section aria-labelledby="tip-title" style={{ '--i': 3 } as CSSProperties} className={`${PANEL} rise flex flex-col gap-3 bg-piece md:col-span-4`}>
          <h2 id="tip-title" className="text-2xl font-extrabold leading-none text-texte">
            Astuce du jour
          </h2>
          <p className="font-titre text-xl font-extrabold leading-tight text-texte">{tip.title}</p>
          <p className="rounded-2xl rounded-bl-sm border-[3px] border-texte bg-surface p-3 text-sm font-semibold text-texte">{tip.text}</p>
          <div className="mt-auto flex items-end justify-between gap-2">
            <button
              type="button"
              onClick={() => setTipOffset((offset) => offset + 1)}
              className="mt-auto min-h-11 self-start rounded-bonbon border-[3px] border-texte bg-surface px-4 font-titre text-base font-extrabold text-texte shadow-bonbon hover:bg-accent-doux focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              Une autre astuce
            </button>
            <Pig mood="content" className="size-16 shrink-0 -scale-x-100" />
          </div>
        </section>
      </div>

      <section aria-labelledby="months-title" style={{ '--i': 4 } as CSSProperties} className={`${PANEL} rise shrink-0 bg-surface`}>
        <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
          <h2 id="months-title" className="text-2xl font-extrabold leading-none text-texte">
            Mon année {today.getFullYear()}
          </h2>
          {progress && (
            <p className="text-xs text-texte-doux">
              {progress.completedMonths} mois bouclé{progress.completedMonths > 1 ? 's' : ''} · un mois manqué se rattrape à tout moment
            </p>
          )}
        </div>
        {progress ? <MonthsStrip months={progress.months} /> : <p role="status" className="text-sm text-texte-doux">Chargement…</p>}
      </section>
    </div>
  );
}
