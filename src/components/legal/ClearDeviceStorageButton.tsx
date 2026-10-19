"use client";

import { useState } from 'react';
import { DEVICE_STORAGE } from '@/constants/deviceStorage';

/** Efface d'un coup le stockage local de l'app sur cet appareil (la session, elle, reste : on se déconnecte pour ça). */
export default function ClearDeviceStorageButton() {
  const [done, setDone] = useState(false);

  const clear = () => {
    try {
      DEVICE_STORAGE.filter((entry) => entry.kind === 'Stockage local').forEach((entry) =>
        window.localStorage.removeItem(entry.name),
      );
    } catch {
      // Stockage indisponible : rien à effacer.
    }
    setDone(true);
  };

  return (
    <p className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={clear}
        className="inline-flex min-h-11 items-center rounded-xl border-[1.5px] border-bordure-forte bg-surface px-4 text-sm font-bold text-texte hover:bg-surface-douce focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus"
      >
        Effacer le stockage local de cet appareil
      </button>
      <span role="status" className="text-sm text-texte-doux">
        {done ? 'C’est fait : rien de My PiggyBank n’est plus gardé dans ce navigateur, à part ta session.' : ''}
      </span>
    </p>
  );
}
