export type PigMood = 'content' | 'endormi' | 'oups';

interface PigProps {
  mood?: PigMood;
  /** Nom accessible quand le cochon porte un sens ; sans lui, il est purement décoratif. */
  label?: string;
  className?: string;
}

const LINE = 'stroke-texte';

/** Le cochon de My PiggyBank : mêmes couleurs que le thème, trois expressions (éveillé, endormi, surpris). */
export default function Pig({ mood = 'content', label, className = 'size-10' }: PigProps) {
  return (
    <svg
      viewBox="0 0 72 72"
      data-mood={mood}
      className={className}
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
    >
      <path d="M14 26l-2-14 14 7z" className={`fill-cochon ${LINE}`} strokeWidth="3" strokeLinejoin="round" />
      <ellipse cx="34" cy="40" rx="26" ry="21" className={`fill-cochon ${LINE}`} strokeWidth="3" />
      <path d="M26 21h14" className={LINE} strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <ellipse cx="57" cy="42" rx="8" ry="7" className={`fill-cochon-bord ${LINE}`} strokeWidth="3" />
      <circle cx="55" cy="42" r="1.5" className="fill-texte" />
      <circle cx="59" cy="42" r="1.5" className="fill-texte" />
      {mood === 'endormi' ? (
        <path d="M39 35q4 3 8 0" className={LINE} strokeWidth="2.6" strokeLinecap="round" fill="none" />
      ) : (
        <>
          <circle cx="43" cy="34" r={mood === 'oups' ? 4.6 : 3.4} className="fill-texte" />
          <circle cx="44.2" cy="32.8" r="1.2" className="fill-surface" />
        </>
      )}
      <ellipse cx="38" cy="45" rx="4.5" ry="3" className="fill-cochon-bord" opacity=".7" />
      {mood === 'oups' ? (
        <ellipse cx="47" cy="50" rx="2.4" ry="2.8" className="fill-texte" />
      ) : (
        <path d="M44 48q3 3 6 0" className={LINE} strokeWidth="2.4" strokeLinecap="round" fill="none" />
      )}
      <path d="M20 58v6M36 60v6" className={LINE} strokeWidth="7" strokeLinecap="round" fill="none" />
      <path d="M20 58v6M36 60v6" className="stroke-cochon" strokeWidth="2.6" strokeLinecap="round" fill="none" />
    </svg>
  );
}
