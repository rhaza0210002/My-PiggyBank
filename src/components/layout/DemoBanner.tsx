"use client";

import { useSyncExternalStore } from 'react';
import { ROUTES } from '@/constants/routes';
import { DEMO_EVENT, endDemo, isDemoActive } from '@/services/demoStore';

export const DEMO_BANNER_TEXT = 'Mode exemple : ces opérations sont fictives et restent sur cet appareil.';

function subscribe(onChange: () => void) {
  window.addEventListener(DEMO_EVENT, onChange);
  return () => window.removeEventListener(DEMO_EVENT, onChange);
}

/** Rappelle, sur toutes les pages, que les opérations affichées sont un exemple local, avec une sortie claire. */
export default function DemoBanner() {
  // Côté serveur et à l'hydratation : inactif, pour ne pas diverger du HTML initial.
  const active = useSyncExternalStore(subscribe, isDemoActive, () => false);
  if (!active) return null;

  const quit = () => {
    endDemo();
    window.location.assign(ROUTES.import);
  };

  return (
    <aside
      role="status"
      className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-attention-fond px-4 py-2 text-center text-sm font-semibold text-attention"
    >
      <span>🧪 {DEMO_BANNER_TEXT}</span>
      <button
        type="button"
        onClick={quit}
        className="min-h-11 rounded-full border-2 border-attention px-4 font-bold focus:outline-none focus:ring-2 focus:ring-focus"
      >
        Quitter l’exemple
      </button>
    </aside>
  );
}
