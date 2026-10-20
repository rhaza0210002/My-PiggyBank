import Image from 'next/image';
import { DAILY_GOAL, tirelireLevel } from '@/utils/tirelire';

interface TirelireProps {
  /** Opérations pointées aujourd'hui. */
  pointed: number;
  goal?: number;
  /** Change à chaque pointage (pas à une annulation) : rejoue la pièce et le rebond. */
  tick: number;
}

const PIG_SRC = '/brand/cochon-tirelire.png';
const BODY_MASK_SRC = '/brand/cochon-tirelire-masque.png';
/** Hauteur d'or (en % de l'image) : dès la première pièce le ventre commence à se remplir (les pattes
 * seules ne se verraient pas), et la tirelire pleine l'est jusqu'à la fente, pas les oreilles. */
const BELLY_START_PERCENT = 14;
const FULL_HEIGHT_PERCENT = 90;
// Pochoir du corps rose seulement : l'or ne recouvre ni les traits, ni les yeux, ni le groin, ni les joues.
const PIG_MASK = {
  maskImage: `url(${BODY_MASK_SRC})`,
  WebkitMaskImage: `url(${BODY_MASK_SRC})`,
  maskSize: '100% 100%',
  WebkitMaskSize: '100% 100%',
};

/**
 * Le cochon du logo est la jauge du jour : une pièce tombe dans la fente à chaque pointage et il se remplit d'or.
 * Le sens est aussi porté par le texte (« 3 sur 10 », « +1 pièce ») ; l'animation n'est qu'un plus.
 */
export default function Tirelire({ pointed, goal = DAILY_GOAL, tick }: TirelireProps) {
  const level = tirelireLevel(pointed, goal);
  // Au-delà de l'objectif, « 18 sur 10 » dérouterait : on dit le nombre et que l'objectif est atteint.
  const isBeyond = pointed > goal;
  const count = isBeyond ? `${pointed}` : `${pointed} sur ${goal}`;
  const spoken = isBeyond ? `${pointed} pointées, objectif de ${goal} atteint` : count;
  const message = tick > 0 ? (level >= 1 ? 'Tirelire pleine pour aujourd’hui, bravo !' : `+1 pièce, ${spoken}`) : '';

  return (
    <div className="flex items-center justify-center gap-4">
      <div className="relative w-[160px] shrink-0 pt-14 sm:w-[200px]">
        {/* La pièce est sous le cochon : elle disparaît derrière son dos en entrant dans la fente. */}
        {tick > 0 && (
          <>
            <span key={`coin-${tick}`} aria-hidden="true" className="tirelire-coin">
              €
            </span>
            <span key={`eclat-${tick}`} aria-hidden="true" className="tirelire-eclat">
              ✨
            </span>
          </>
        )}
        <div
          role="img"
          aria-label={`Tirelire du jour : ${spoken}`}
          data-niveau={String(level)}
          className={`relative z-10 ${tick > 0 ? (tick % 2 ? 'tirelire-pig-a' : 'tirelire-pig-b') : ''}`}
        >
          <Image src={PIG_SRC} alt="" width={431} height={332} loading="eager" className="h-auto w-full" />
          <div aria-hidden="true" className="absolute inset-0 overflow-hidden" style={PIG_MASK}>
            <div
              className="tirelire-niveau absolute inset-x-0 bottom-0 bg-piece"
              style={{ height: `${level > 0 ? BELLY_START_PERCENT + level * (FULL_HEIGHT_PERCENT - BELLY_START_PERCENT) : 0}%` }}
            />
          </div>
        </div>
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
