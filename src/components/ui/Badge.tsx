import type { ReactNode } from 'react';

export type BadgeTone = 'ok' | 'attention' | 'depasse' | 'piece';

const TONES: Record<BadgeTone, { classes: string; icon: string }> = {
  ok: { classes: 'bg-ok-fond text-ok', icon: '✓' },
  attention: { classes: 'bg-attention-fond text-attention', icon: '●' },
  depasse: { classes: 'bg-depasse-fond text-depasse', icon: '▲' },
  piece: { classes: 'bg-piece text-sur-accent', icon: '🪙' },
};

/** Pastille d'état : l'icône et le texte portent le sens, la couleur ne fait que l'appuyer. */
export default function Badge({ tone, children }: { tone: BadgeTone; children: ReactNode }) {
  const { classes, icon } = TONES[tone];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-bonbon px-3 py-1 text-sm font-bold ${classes}`}>
      <span aria-hidden="true">{icon}</span>
      {children}
    </span>
  );
}
