"use client";

import { useState, useSyncExternalStore } from 'react';
import { countRememberedFormats, forgetFormats } from '@/services/importFormatMemory';

const CARD = 'rounded-3xl border-[1.5px] border-bordure bg-surface p-4 shadow-sm';
const BUTTON =
  'min-h-11 rounded-2xl border-[1.5px] border-bordure bg-accent-doux px-4 text-sm font-semibold text-accent-fort transition-colors hover:bg-accent-doux focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus';

interface RememberedFormatsViewProps {
  count: number;
  forgotten: boolean;
  onForget: () => void;
}

export function RememberedFormatsView({ count, forgotten, onForget }: RememberedFormatsViewProps) {
  return (
    <section aria-labelledby="formats-title" className={CARD}>
      <h2 id="formats-title" className="text-lg font-bold text-texte">Réglages d’import retenus sur cet appareil</h2>
      <p className="mt-1 text-sm text-texte-doux">
        Tes réponses aux questions d’import (quelle colonne est la date, le montant…), pour ne pas te les reposer.
        Gardées dans ce navigateur seulement, sans aucune opération ni aucun montant.
      </p>
      {count > 0 ? (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <p className="text-sm font-semibold text-texte">
            {count} format{count > 1 ? 's' : ''} retenu{count > 1 ? 's' : ''}
          </p>
          <button type="button" onClick={onForget} className={BUTTON}>Oublier</button>
        </div>
      ) : (
        !forgotten && <p className="mt-3 text-sm font-semibold text-texte">Aucun réglage retenu.</p>
      )}
      <p role="status" className="mt-2 text-sm font-semibold text-ok">{forgotten ? 'C’est oublié.' : ''}</p>
    </section>
  );
}

const subscribeNothing = () => () => {};

/** Carte de Mes données : le stockage local n'est lisible qu'une fois la page montée dans le navigateur. */
export default function RememberedFormatsCard() {
  const [forgotten, setForgotten] = useState(false);
  // Relu à chaque affichage ; côté serveur il n'y a pas de stockage local, donc rien de retenu.
  const count = useSyncExternalStore(subscribeNothing, countRememberedFormats, () => 0);

  return (
    <RememberedFormatsView
      count={count}
      forgotten={forgotten}
      onForget={() => {
        forgetFormats();
        setForgotten(true);
      }}
    />
  );
}
