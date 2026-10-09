"use client";

import { useEffect, useRef, useState } from 'react';
import {
  DEFAULT_PREFS,
  STORAGE_KEY,
  applyPrefs,
  parsePrefs,
  type AccessibilityKey,
  type AccessibilityPrefs,
} from '@/utils/accessibilityPrefs';

const PETALS: { key: AccessibilityKey; label: string; symbol: string }[] = [
  { key: 'police', label: 'Police lisible (Luciole)', symbol: 'Aa' },
  { key: 'grand', label: 'Texte plus grand', symbol: 'A+' },
  { key: 'contraste', label: 'Contraste renforcé', symbol: '◐' },
  { key: 'calme', label: 'Moins d’animations', symbol: '⏸' },
  { key: 'espace', label: 'Lettres plus espacées', symbol: '↔' },
];

/** Les pétales s'ouvrent en quart de cercle, de la gauche du bouton jusqu'au-dessus de lui. */
const RADIUS_PX = 150;
const petalOffset = (index: number) => {
  const angle = Math.PI + (index * (Math.PI / 2)) / (PETALS.length - 1);
  return { x: Math.round(RADIUS_PX * Math.cos(angle)), y: Math.round(RADIUS_PX * Math.sin(angle)) };
};

function readStoredPrefs(): AccessibilityPrefs {
  try {
    return parsePrefs(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

/** Bouton flottant ♿ : au clic, une fleur de réglages d'accessibilité (gardés sur l'appareil). */
export default function AccessibilityFlower() {
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState<AccessibilityPrefs>(DEFAULT_PREFS);
  const [announcement, setAnnouncement] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Les attributs de <html> sont déjà posés par le script de l'en-tête : on relit seulement l'état pour les pétales.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPrefs(readStoredPrefs());
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      mainRef.current?.focus();
    };
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [open]);

  const toggle = (key: AccessibilityKey, label: string) => {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    applyPrefs(document.documentElement, next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Stockage indisponible (navigation privée) : le réglage vaut pour cette visite seulement.
    }
    setAnnouncement(`${label} : ${next[key] ? 'activé' : 'désactivé'}`);
  };

  return (
    <div ref={rootRef} className="fixed right-4 bottom-20 z-40 md:right-6 md:bottom-6">
      {PETALS.map((petal, index) => {
        const { x, y } = petalOffset(index);
        const pressed = prefs[petal.key];
        return (
          <button
            key={petal.key}
            type="button"
            aria-label={petal.label}
            aria-pressed={pressed}
            data-tip={petal.label}
            tabIndex={open ? 0 : -1}
            onClick={() => toggle(petal.key, petal.label)}
            style={open ? { transform: `translate(${x}px, ${y}px)` } : undefined}
            className={`absolute right-0.5 bottom-0.5 z-10 flex size-13 items-center justify-center rounded-full border-[3px] border-accent-fort text-base font-black text-texte shadow-bonbon transition-[transform,opacity] duration-300 ease-out after:pointer-events-none after:absolute after:right-1/2 after:bottom-[calc(100%+8px)] after:translate-x-[30%] after:rounded-xl after:bg-texte after:px-2.5 after:py-1.5 after:text-sm after:font-bold after:whitespace-nowrap after:text-surface after:opacity-0 after:content-[attr(data-tip)] hover:z-30 hover:after:opacity-100 focus-visible:z-30 focus-visible:after:opacity-100 ${
              pressed ? 'onglet-actif border-transparent' : 'bg-accent-doux'
            } ${open ? 'opacity-100' : 'invisible scale-50 opacity-0'}`}
          >
            <span aria-hidden="true">{petal.symbol}</span>
          </button>
        );
      })}

      <button
        ref={mainRef}
        type="button"
        aria-label="Accessibilité"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={`relative z-20 flex size-14 items-center justify-center rounded-full border-[3px] border-texte bg-surface text-3xl shadow-doux transition-transform duration-300 ${open ? 'rotate-90' : ''}`}
      >
        <span aria-hidden="true">♿</span>
      </button>

      <p role="status" className="sr-only">
        {announcement}
      </p>
    </div>
  );
}
