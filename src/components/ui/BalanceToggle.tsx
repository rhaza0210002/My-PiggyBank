"use client";

import { useState } from 'react';

/** Remplace un montant tant que le solde est caché : même largeur approximative, aucune valeur dans le DOM. */
export const MASKED_AMOUNT = '•••• €';

/** Le solde repart toujours caché : l'état n'est volontairement pas mémorisé. */
export function useBalanceVisibility() {
  const [isShown, setIsShown] = useState(false);
  return { isShown, toggle: () => setIsShown((current) => !current) };
}

/** Texte à afficher : le montant réel une fois révélé, sinon le masque. */
export function revealAmount(isShown: boolean, amount: string): string {
  return isShown ? amount : MASKED_AMOUNT;
}

interface BalanceToggleProps {
  isShown: boolean;
  onToggle: () => void;
  /** Ce que le bouton révèle, ex. « le solde du mois ». */
  subject?: string;
  className?: string;
}

export default function BalanceToggle({ isShown, onToggle, subject = 'le solde du mois', className = '' }: BalanceToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={isShown}
      aria-label={`${isShown ? 'Cacher' : 'Afficher'} ${subject}`}
      className={`inline-flex size-11 shrink-0 items-center justify-center rounded-full border-2 border-[#d8b7a5] bg-[#fff8f2] text-lg shadow-[0_2px_0_rgba(140,103,86,0.15)] transition hover:bg-[#F8D5CB] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#5b473d] ${className}`}
    >
      <span key={String(isShown)} aria-hidden="true" className="motion-safe:animate-[pop_0.3s_ease-out_1]">
        {isShown ? '👀' : '🐷'}
      </span>
    </button>
  );
}
