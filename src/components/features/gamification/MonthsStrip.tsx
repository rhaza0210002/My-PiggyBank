import { MONTHS, MONTH_SHORT_LABELS } from '@/constants/tableStyles';
import type { CSSProperties } from 'react';
import type { MonthProgress, MonthStatus } from '@/utils/gamification';

const STATUS_STYLE: Record<MonthStatus, { icon: string; text: string; className: string }> = {
  complete: { icon: '✓', text: 'Bouclé', className: 'border-bordure bg-ok-fond text-ok' },
  'in-progress': { icon: '●', text: 'En cours', className: 'border-accent-fort bg-accent-doux text-depasse' },
  'catch-up': { icon: '↺', text: 'À rattraper', className: 'border-bordure bg-attention-fond text-attention' },
  empty: { icon: '–', text: 'Vide', className: 'border-bordure bg-surface text-texte-doux' },
  future: { icon: '', text: 'À venir', className: 'border-dashed border-bordure bg-transparent text-texte-doux' },
};

interface MonthsStripProps {
  months: MonthProgress[];
}

/** Les 12 mois de l'année : l'état est dit en toutes lettres (pas seulement par la couleur) et reste bienveillant. */
export default function MonthsStrip({ months }: MonthsStripProps) {
  return (
    <ol aria-label="Progression mois par mois" className="grid grid-cols-6 gap-1.5 sm:grid-cols-12">
      {months.map((month) => {
        const style = STATUS_STYLE[month.status];
        const fullLabel = MONTHS[month.monthIndex].label;

        return (
          <li
            key={month.monthIndex}
            style={{ '--i': month.monthIndex * 0.5 } as CSSProperties}
            className={`rise flex min-h-12 flex-col items-center justify-center rounded-xl border-2 px-1 py-1 text-center ${style.className}`}
          >
            <span className="text-xs font-bold leading-tight" aria-hidden="true">
              {MONTH_SHORT_LABELS[month.monthIndex]}
            </span>
            <span className="text-xs font-semibold leading-tight" aria-hidden="true">
              {style.icon || '·'} <span className="hidden sm:inline">{style.text}</span>
            </span>
            <span className="sr-only">
              {fullLabel} : {style.text}
              {month.total > 0 ? `, ${month.done} sur ${month.total} opérations pointées` : ''}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
