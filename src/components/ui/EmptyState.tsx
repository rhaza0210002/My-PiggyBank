import Link from 'next/link';
import Pig, { type PigMood } from '@/components/ui/Pig';

interface EmptyStateProps {
  title: string;
  text?: string;
  /** Lien vers l'étape qui remplit cet écran. */
  action?: { href: string; label: string };
  mood?: PigMood;
  /** Dans un tableau ou une carte : plus petit, sans décor. */
  compact?: boolean;
}

/** Écran vide : le cochon, une phrase douce et, si utile, la prochaine étape. Jamais un reproche. */
export default function EmptyState({ title, text, action, mood = 'endormi', compact = false }: EmptyStateProps) {
  return (
    <div role="status" className={`relative flex flex-col items-center text-center ${compact ? 'gap-1 py-3' : 'gap-2 py-8'}`}>
      {!compact && (
        <span aria-hidden="true" data-deco className="pointer-events-none absolute inset-0 overflow-hidden">
          <span className="absolute left-[18%] top-4 text-xl text-piece-bord">✦</span>
          <span className="absolute right-[20%] top-10 text-base text-corail">✧</span>
          <span className="absolute bottom-6 left-[28%] size-10 rounded-full bg-piece/40" />
        </span>
      )}
      <Pig mood={mood} className={`relative ${compact ? 'size-12' : 'size-20'}`} />
      <p className={`relative font-titre font-extrabold text-texte ${compact ? 'text-base' : 'text-xl'}`}>{title}</p>
      {text && <p className="relative max-w-sm text-sm text-texte-doux">{text}</p>}
      {action && (
        <Link
          href={action.href}
          className="relative mt-1 inline-flex min-h-11 items-center rounded-bonbon border-2 border-texte bg-corail px-5 font-titre font-extrabold text-sur-corail shadow-bonbon transition-transform hover:translate-y-[2px] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus motion-reduce:transition-none"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
