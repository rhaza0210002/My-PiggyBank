import { useId, type ReactNode } from 'react';

interface FieldControlProps {
  id: string;
  'aria-describedby': string | undefined;
}

interface FieldProps {
  label: string;
  hint?: string;
  error?: string;
  children: (props: FieldControlProps) => ReactNode;
}

/** Champ commun : étiquette au-dessus, aide dessous, erreur en mots (jamais la couleur seule). */
export default function Field({ label, hint, error, children }: FieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined;

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-base font-bold text-texte">
        {label}
      </label>
      {children({ id, 'aria-describedby': describedBy })}
      {hint && (
        <p id={hintId} className="text-sm text-texte-doux">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-sm font-bold text-depasse">
          <span aria-hidden="true">▲ </span>
          {error}
        </p>
      )}
    </div>
  );
}
