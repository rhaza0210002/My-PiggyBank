import type { Badge } from '@/utils/gamification';

const BADGE_ICONS: Record<string, string> = {
  'first-operation': '🌱',
  'ten-operations': '🔟',
  'hundred-operations': '💯',
  'first-month': '🗓️',
  'catch-up': '🔄',
  'three-months': '🥉',
  'six-months': '🥈',
  'twelve-months': '🥇',
};

import type { CSSProperties } from 'react';

export default function BadgeShelf({ badges }: { badges: Badge[] }) {
  return (
    <ul aria-label="Badges" className="grid w-full grid-cols-8 gap-1 md:grid-cols-[repeat(auto-fit,minmax(5.5rem,1fr))] md:gap-1.5">
      {badges.map((badge, index) => (
        <li
          key={badge.id}
          style={{ '--i': index * 0.6 } as CSSProperties}
          title={`${badge.label} : ${badge.description}`}
          className={`rise flex min-h-10 min-w-0 flex-col items-center justify-center rounded-xl border-2 px-0.5 py-1 text-center md:min-h-14 md:px-1 ${
            badge.earned
              ? 'border-bordure bg-attention-fond text-attention'
              : 'border-dashed border-bordure bg-transparent text-texte-doux'
          }`}
        >
          <span className={`text-lg ${badge.earned ? '' : 'opacity-40 grayscale'}`} aria-hidden="true">
            {BADGE_ICONS[badge.id] ?? '⭐'}
          </span>
          <span aria-hidden="true" className="hidden text-xs font-bold leading-tight [overflow-wrap:anywhere] md:inline">{badge.label}</span>
          <span className="sr-only">
            {badge.label} : {badge.earned ? 'obtenu' : `à débloquer, ${badge.description}`}
          </span>
        </li>
      ))}
    </ul>
  );
}
