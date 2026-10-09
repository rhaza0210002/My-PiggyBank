import { useId } from 'react';
import { DAILY_GOAL, tirelireLevel } from '@/utils/tirelire';

interface TirelireProps {
  /** Opérations pointées aujourd'hui. */
  pointed: number;
  goal?: number;
  /** Change à chaque pointage (pas à une annulation) : rejoue la pièce et le rebond. */
  tick: number;
}

const BODY = { cx: 120, cy: 104, rx: 92, ry: 82 };
const FILL_TRAVEL = 148;

/**
 * Le cochon est la jauge du jour : une pièce tombe dans la fente à chaque pointage et le niveau de pièces monte.
 * Le sens est aussi porté par le texte (« 3 sur 10 », « +1 pièce ») ; l'animation n'est qu'un plus.
 */
export default function Tirelire({ pointed, goal = DAILY_GOAL, tick }: TirelireProps) {
  const clipId = useId();
  const level = tirelireLevel(pointed, goal);
  const count = `${pointed} sur ${goal}`;
  const message = tick > 0 ? (level >= 1 ? 'Tirelire pleine pour aujourd’hui, bravo !' : `+1 pièce, ${count}`) : '';

  return (
    <div className="flex items-center justify-center gap-4">
      <div className="relative h-[130px] w-[160px] shrink-0 sm:h-[160px] sm:w-[200px]">
        {tick > 0 && (
          <span key={`coin-${tick}`} aria-hidden="true" className="tirelire-coin">
            €
          </span>
        )}
        <svg
          key={`pig-${tick}`}
          role="img"
          aria-label={`Tirelire du jour : ${count}`}
          data-niveau={String(level)}
          viewBox="0 0 260 210"
          className={`h-full w-full ${tick > 0 ? 'tirelire-pig' : ''}`}
          strokeLinejoin="round"
          strokeLinecap="round"
        >
          <defs>
            <clipPath id={clipId}>
              <ellipse {...BODY} />
            </clipPath>
          </defs>
          <path d="M32 106 C14 100 16 80 30 82 C40 84 36 94 27 92" fill="none" className="stroke-cochon-bord" strokeWidth="5" />
          <path d="M176 50 Q184 12 212 22 Q218 40 200 66Z" className="fill-cochon stroke-cochon-bord" strokeWidth="4" />
          <rect x="68" y="166" width="40" height="32" rx="16" className="fill-cochon stroke-cochon-bord" strokeWidth="4" />
          <rect x="138" y="166" width="40" height="32" rx="16" className="fill-cochon stroke-cochon-bord" strokeWidth="4" />
          <ellipse {...BODY} className="fill-cochon" />
          <g clipPath={`url(#${clipId})`}>
            <rect
              x="0"
              y="186"
              width="260"
              height="160"
              className="tirelire-niveau fill-piece"
              style={{ transform: `translateY(${-level * FILL_TRAVEL}px)` }}
            />
          </g>
          <ellipse {...BODY} fill="none" className="stroke-cochon-bord" strokeWidth="4" />
          <path d="M62 52 Q76 34 98 30" fill="none" className="stroke-surface" strokeWidth="6" opacity="0.7" />
          <path d="M134 44 Q132 6 164 12 Q182 22 176 54Z" className="fill-cochon stroke-cochon-bord" strokeWidth="4" />
          <path d="M147 42 Q147 22 162 26 Q169 34 167 48Z" className="fill-cochon-bord" opacity="0.5" />
          <rect x="86" y="24" width="42" height="8" rx="4" className="fill-texte" opacity="0.7" />
          <ellipse cx="156" cy="120" rx="14" ry="8" className="fill-cochon-bord" opacity="0.5" />
          <g className="tirelire-oeil">
            <ellipse cx="166" cy="92" rx="9" ry="11" className="fill-texte" />
            <circle cx="169" cy="87" r="3.4" className="fill-surface" />
          </g>
          <ellipse cx="208" cy="108" rx="18" ry="21" className="fill-cochon-bord" opacity="0.8" />
          <ellipse cx="202" cy="106" rx="3" ry="5" className="fill-texte" opacity="0.6" />
          <ellipse cx="214" cy="105" rx="3" ry="5" className="fill-texte" opacity="0.6" />
          <path d="M176 126 Q184 134 192 126" fill="none" className="stroke-texte" strokeWidth="3.5" opacity="0.7" />
        </svg>
      </div>
      <div>
        <p className="text-2xl font-black text-texte">{count}</p>
        <p className="text-sm text-texte-doux">pointées aujourd’hui</p>
        <p role="status" className="min-h-6 text-sm font-bold text-attention">
          {message && <span aria-hidden="true">🪙 </span>}
          {message}
        </p>
      </div>
    </div>
  );
}
