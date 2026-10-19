import { useId } from 'react';
import { DAILY_GOAL, tirelireLevel } from '@/utils/tirelire';

interface TirelireProps {
  /** Opérations pointées aujourd'hui. */
  pointed: number;
  goal?: number;
  /** Change à chaque pointage (pas à une annulation) : rejoue la pièce et le rebond. */
  tick: number;
}

const BODY = { cx: 130, cy: 112, rx: 92, ry: 80 };
const FILL_TRAVEL = 150;

/**
 * Le cochon est la jauge du jour : une pièce tombe dans la fente à chaque pointage et le niveau de pièces monte.
 * Le sens est aussi porté par le texte (« 3 sur 10 », « +1 pièce ») ; l'animation n'est qu'un plus.
 */
export default function Tirelire({ pointed, goal = DAILY_GOAL, tick }: TirelireProps) {
  const clipId = useId();
  const level = tirelireLevel(pointed, goal);
  // Au-delà de l'objectif, « 18 sur 10 » dérouterait : on dit le nombre et que l'objectif est atteint.
  const isBeyond = pointed > goal;
  const count = isBeyond ? `${pointed}` : `${pointed} sur ${goal}`;
  const spoken = isBeyond ? `${pointed} pointées, objectif de ${goal} atteint` : count;
  const message = tick > 0 ? (level >= 1 ? 'Tirelire pleine pour aujourd’hui, bravo !' : `+1 pièce, ${spoken}`) : '';

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
          aria-label={`Tirelire du jour : ${spoken}`}
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
          <path d="M220 120c16-2 22-18 12-24-9-5-15 6-6 10 6 3 12-1 14-6" fill="none" className="stroke-cochon-trait" strokeWidth="5" />
          <rect x="80" y="170" width="36" height="32" rx="14" className="fill-cochon stroke-cochon-trait" strokeWidth="5" />
          <rect x="144" y="170" width="36" height="32" rx="14" className="fill-cochon stroke-cochon-trait" strokeWidth="5" />
          <path d="M58 84C44 52 48 26 64 20c18-4 38 14 46 26z" className="fill-cochon stroke-cochon-trait" strokeWidth="5" />
          <path d="M202 84c14-32 10-58-6-64-18-4-38 14-46 26z" className="fill-cochon stroke-cochon-trait" strokeWidth="5" />
          <path d="M66 70c-8-18-6-34 2-37 12-1 24 9 30 17z" className="fill-cochon-bord" />
          <path d="M194 70c8-18 6-34-2-37-12-1-24 9-30 17z" className="fill-cochon-bord" />
          <ellipse {...BODY} className="fill-cochon" />
          <g clipPath={`url(#${clipId})`}>
            <rect
              x="0"
              y="192"
              width="260"
              height="170"
              className="tirelire-niveau fill-piece"
              style={{ transform: `translateY(${-level * FILL_TRAVEL}px)` }}
            />
          </g>
          <ellipse {...BODY} fill="none" className="stroke-cochon-trait" strokeWidth="5" />
          <path d="M66 86Q74 60 96 48" fill="none" className="stroke-surface" strokeWidth="7" opacity="0.7" />
          <rect x="108" y="40" width="44" height="9" rx="4.5" className="fill-cochon-trait" />
          <g className="tirelire-oeil">
            <ellipse cx="94" cy="104" rx="10" ry="12" className="fill-cochon-trait" />
            <ellipse cx="166" cy="104" rx="10" ry="12" className="fill-cochon-trait" />
            <circle cx="98" cy="99" r="4.2" className="fill-surface" />
            <circle cx="170" cy="99" r="4.2" className="fill-surface" />
            <circle cx="90" cy="109" r="2" className="fill-surface" />
            <circle cx="162" cy="109" r="2" className="fill-surface" />
          </g>
          <ellipse cx="68" cy="130" rx="15" ry="10" className="fill-cochon-bord" opacity="0.75" />
          <ellipse cx="192" cy="130" rx="15" ry="10" className="fill-cochon-bord" opacity="0.75" />
          <ellipse cx="130" cy="130" rx="28" ry="20" className="fill-cochon-bord stroke-cochon-trait" strokeWidth="5" />
          <ellipse cx="120" cy="130" rx="4.5" ry="7" className="fill-cochon-trait" />
          <ellipse cx="140" cy="130" rx="4.5" ry="7" className="fill-cochon-trait" />
          <path d="M117 162q13 9 26 0" fill="none" className="stroke-cochon-trait" strokeWidth="5" />
        </svg>
      </div>
      <div>
        <p className="text-2xl font-black text-texte">{count}</p>
        <p className="text-sm text-texte-doux">
          pointées aujourd’hui{isBeyond && <><br />objectif de {goal} atteint</>}
        </p>
        <p role="status" className="min-h-6 text-sm font-bold text-attention">
          {message && <span aria-hidden="true">🪙 </span>}
          {message}
        </p>
      </div>
    </div>
  );
}
