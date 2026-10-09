import type { ButtonHTMLAttributes } from 'react';

export type ButtonVariant = 'principal' | 'secondaire' | 'lien' | 'doux';

const BASE =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-bonbon px-5 text-base font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60';

const VARIANTS: Record<ButtonVariant, string> = {
  principal: 'bg-accent text-sur-accent shadow-bonbon hover:bg-accent-doux',
  secondaire: 'border-2 border-bordure-forte bg-surface text-texte hover:bg-surface-douce',
  lien: 'px-2 text-accent-fort underline underline-offset-2 hover:text-texte',
  doux: 'bg-depasse-fond text-depasse hover:bg-accent-doux',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

/** Bouton commun : zone tactile d'au moins 44 px, focus visible (règle globale), un seul `principal` par écran. */
export default function Button({ variant = 'principal', type = 'button', className = '', ...props }: ButtonProps) {
  return <button type={type} className={`${BASE} ${VARIANTS[variant]} ${className}`} {...props} />;
}
