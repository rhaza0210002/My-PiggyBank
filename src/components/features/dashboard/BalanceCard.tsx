import { useId, type CSSProperties } from 'react';
import BalanceToggle, { MASKED_AMOUNT } from '@/components/ui/BalanceToggle';

interface BalanceCardProps {
  monthName: string;
  isShown: boolean;
  onToggle: () => void;
  /** Montant déjà formaté, ou null tant qu'il n'y a rien à montrer. */
  amountText: string | null;
  /** Précision visible seulement une fois le montant révélé. */
  detail: string | null;
  negative?: boolean;
  style?: CSSProperties;
  className?: string;
}

/** « Ton solde » : le montant reste caché tant que la personne ne choisit pas de le voir. */
export default function BalanceCard({ monthName, isShown, onToggle, amountText, detail, negative = false, style, className = '' }: BalanceCardProps) {
  const titleId = useId();

  return (
    <section
      aria-labelledby={titleId}
      style={style}
      className={`flex flex-col gap-2 rounded-carte border-[3px] border-texte bg-cochon p-4 shadow-sticker sm:p-5 ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id={titleId} className="text-2xl font-extrabold leading-none text-texte">
          Ton solde
        </h2>
        <BalanceToggle isShown={isShown} onToggle={onToggle} />
      </div>

      {amountText === null ? (
        <p className="text-sm font-semibold text-texte">Importe un relevé pour voir ton solde de {monthName.toLowerCase()}.</p>
      ) : (
        <>
          <p aria-live="polite" className="font-titre text-4xl font-extrabold leading-none text-texte">
            {isShown ? (
              <span className={negative ? 'text-depasse' : undefined}>{amountText}</span>
            ) : (
              <>
                <span aria-hidden="true">{MASKED_AMOUNT}</span>
                <span className="sr-only">Montant caché</span>
              </>
            )}
          </p>
          <p className="text-sm font-semibold text-texte">
            Solde de {monthName.toLowerCase()}
            {isShown && detail ? ` · ${detail}` : ''}
          </p>
        </>
      )}
    </section>
  );
}
