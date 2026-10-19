export type PigMood = 'content' | 'endormi' | 'oups';

interface PigProps {
  mood?: PigMood;
  /** Nom accessible quand le cochon porte un sens ; sans lui, il est purement décoratif. */
  label?: string;
  className?: string;
}

const LINE = 'stroke-cochon-trait';
const INK = 'fill-cochon-trait';

/**
 * Le cochon de My PiggyBank, dessiné d'après le logo : vu de face, tout rond, oreilles arrondies,
 * joues roses et fente à pièce sur la tête. Trois expressions : content (yeux rieurs), endormi
 * (solde caché) et oups (yeux grands ouverts).
 */
export default function Pig({ mood = 'content', label, className = 'size-10' }: PigProps) {
  return (
    <svg
      viewBox="0 0 72 72"
      data-mood={mood}
      className={className}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
    >
      <path d="M60 42c5 0 7-5 4.5-7.5-2.5-2-5 1.5-2.5 3.2 1.8 1.1 3.6-.2 4.2-1.8" className={LINE} strokeWidth="2.2" fill="none" />
      <rect x="19" y="54" width="11" height="11" rx="4.5" className={`fill-cochon ${LINE}`} strokeWidth="2.4" />
      <rect x="42" y="54" width="11" height="11" rx="4.5" className={`fill-cochon ${LINE}`} strokeWidth="2.4" />
      <path d="M14 30C10 20 11 12 16 10c6-1 13 5 16 10z" className={`fill-cochon ${LINE}`} strokeWidth="2.4" />
      <path d="M58 30c4-10 3-18-2-20-6-1-13 5-16 10z" className={`fill-cochon ${LINE}`} strokeWidth="2.4" />
      <path d="M17.5 25c-1.6-5-1-9 1-10.4 3.4-.4 7 2.4 9 5.4z" className="fill-cochon-bord" />
      <path d="M54.5 25c1.6-5 1-9-1-10.4-3.4-.4-7 2.4-9 5.4z" className="fill-cochon-bord" />
      <ellipse cx="36" cy="38" rx="25" ry="23" className={`fill-cochon ${LINE}`} strokeWidth="2.4" />
      <path d="M18.5 32q2-7.5 8.5-11" className="stroke-surface" strokeWidth="2.6" fill="none" opacity=".8" />
      <path d="M30.5 19.5h11" className={LINE} strokeWidth="2.8" fill="none" />
      {mood === 'content' && (
        <path d="M21.5 37q3.5-4.5 7 0M43.5 37q3.5-4.5 7 0" className={LINE} strokeWidth="2.4" fill="none" />
      )}
      {mood === 'endormi' && (
        <path d="M21.5 35.5q3.5 3.5 7 0M43.5 35.5q3.5 3.5 7 0" className={LINE} strokeWidth="2.4" fill="none" />
      )}
      {mood === 'oups' && (
        <>
          <ellipse cx="25" cy="35.5" rx="3.3" ry="4" className={INK} />
          <ellipse cx="47" cy="35.5" rx="3.3" ry="4" className={INK} />
          <circle cx="26.2" cy="34" r="1.3" className="fill-surface" />
          <circle cx="48.2" cy="34" r="1.3" className="fill-surface" />
        </>
      )}
      <ellipse cx="18.5" cy="44" rx="4.6" ry="3" className="fill-cochon-bord" opacity=".75" />
      <ellipse cx="53.5" cy="44" rx="4.6" ry="3" className="fill-cochon-bord" opacity=".75" />
      <ellipse cx="36" cy="43.5" rx="8.2" ry="5.8" className={`fill-cochon-bord ${LINE}`} strokeWidth="2.2" />
      <ellipse cx="33" cy="43.5" rx="1.3" ry="2" className={INK} />
      <ellipse cx="39" cy="43.5" rx="1.3" ry="2" className={INK} />
      {mood === 'oups' ? (
        <ellipse cx="36" cy="53" rx="2" ry="2.4" className={INK} />
      ) : (
        <path d="M32.5 52.5q3.5 3 7 0" className={LINE} strokeWidth="2.2" fill="none" />
      )}
    </svg>
  );
}
