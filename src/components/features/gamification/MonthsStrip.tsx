import { MONTHS, MONTH_SHORT_LABELS } from '@/constants/tableStyles';
import type { MonthProgress, MonthStatus } from '@/utils/gamification';

const STATUS_STYLE: Record<MonthStatus, { icon: string; text: string; className: string }> = {
  complete: { icon: '✓', text: 'Bouclé', className: 'border-[#6f9a6f] bg-[#eaf4e6] text-[#1f4d25]' },
  'in-progress': { icon: '●', text: 'En cours', className: 'border-[#a3452a] bg-[#F8D5CB] text-[#7a2f1a]' },
  'catch-up': { icon: '↺', text: 'À rattraper', className: 'border-[#d6a85c] bg-[#fff1da] text-[#6b4210]' },
  empty: { icon: '–', text: 'Vide', className: 'border-[#d8b7a5] bg-[#fff8f2] text-[#6b574c]' },
  future: { icon: '', text: 'À venir', className: 'border-dashed border-[#d8b7a5] bg-transparent text-[#7d685c]' },
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
            className={`flex min-h-12 flex-col items-center justify-center rounded-xl border-2 px-1 py-1 text-center ${style.className}`}
          >
            <span className="text-xs font-bold leading-tight" aria-hidden="true">
              {MONTH_SHORT_LABELS[month.monthIndex]}
            </span>
            <span className="text-[0.65rem] font-semibold leading-tight" aria-hidden="true">
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
