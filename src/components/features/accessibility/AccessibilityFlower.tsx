"use client";

import { useEffect, useRef, useState } from 'react';
import {
  DEFAULT_PREFS,
  ZOOM_MAX,
  ZOOM_MIN,
  ZOOM_STEP,
  clampZoom,
  loadPrefs,
  savePrefs,
  type AccessibilityPrefs,
  type AccessibilityToggleKey,
} from '@/utils/accessibilityPrefs';

type Petal =
  | { kind: 'toggle'; key: AccessibilityToggleKey; label: string; symbol: string }
  | { kind: 'zoom'; step: 1 | -1; verb: string; symbol: string };

const PETALS: Petal[] = [
  { kind: 'toggle', key: 'police', label: 'Police lisible (Luciole)', symbol: 'Aa' },
  { kind: 'zoom', step: -1, verb: 'Réduire le texte', symbol: 'A↓' },
  { kind: 'zoom', step: 1, verb: 'Agrandir le texte', symbol: 'A↑' },
  { kind: 'toggle', key: 'contraste', label: 'Contraste renforcé', symbol: '◐' },
  { kind: 'toggle', key: 'calme', label: 'Moins d’animations', symbol: '⏸' },
  { kind: 'toggle', key: 'espace', label: 'Lettres plus espacées', symbol: '↔' },
];

/** Les pétales s'ouvrent en quart de cercle, de la gauche du bouton jusqu'au-dessus de lui. */
const RADIUS_PX = 200;
const petalOffset = (index: number) => {
  const angle = Math.PI + (index * (Math.PI / 2)) / (PETALS.length - 1);
  return { x: Math.round(RADIUS_PX * Math.cos(angle)), y: Math.round(RADIUS_PX * Math.sin(angle)) };
};

/** Bouton flottant ♿ : au clic, une fleur de réglages d'accessibilité (gardés sur l'appareil). */
export default function AccessibilityFlower() {
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState<AccessibilityPrefs>(DEFAULT_PREFS);
  const [announcement, setAnnouncement] = useState('');
  const [confirming, setConfirming] = useState(false);
  const keepRef = useRef<HTMLButtonElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Les attributs de <html> sont déjà posés par le script de l'en-tête : on relit seulement l'état pour les pétales.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPrefs(loadPrefs());
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (confirming) {
        setConfirming(false);
        return;
      }
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
  }, [open, confirming]);

  useEffect(() => {
    if (confirming) keepRef.current?.focus();
  }, [confirming]);

  // On relit toujours l'état enregistré : Compte → Paramètres peut avoir remis le bouton entre-temps.
  const commit = (patch: Partial<AccessibilityPrefs>, message: string) => {
    const next = { ...loadPrefs(), ...patch };
    setPrefs(next);
    savePrefs(next);
    setAnnouncement(message);
  };

  const toggle = (key: AccessibilityToggleKey, label: string) => {
    const value = !prefs[key];
    commit({ [key]: value }, `${label} : ${value ? 'activé' : 'désactivé'}`);
  };

  const changeZoom = (step: 1 | -1) => {
    const zoom = clampZoom(prefs.zoom + step * ZOOM_STEP);
    commit({ zoom }, `Zoom du texte : ${zoom} %`);
  };

  return (
    <div ref={rootRef} data-fleur className="fixed right-4 bottom-20 z-40 md:right-6 md:bottom-6">
      {PETALS.map((petal, index) => {
        const { x, y } = petalOffset(index);
        const isZoom = petal.kind === 'zoom';
        const pressed = !isZoom && prefs[petal.key];
        const label = isZoom ? `${petal.verb} (zoom actuel ${prefs.zoom} %)` : petal.label;
        const atLimit = isZoom && (petal.step === 1 ? prefs.zoom >= ZOOM_MAX : prefs.zoom <= ZOOM_MIN);
        return (
          <button
            key={isZoom ? `zoom${petal.step}` : petal.key}
            type="button"
            aria-label={label}
            aria-pressed={isZoom ? undefined : pressed}
            data-tip={isZoom ? `${petal.verb} · ${prefs.zoom} %` : label}
            disabled={atLimit}
            tabIndex={open ? 0 : -1}
            onClick={() => (isZoom ? changeZoom(petal.step) : toggle(petal.key, petal.label))}
            style={open ? { transform: `translate(${x}px, ${y}px)` } : undefined}
            className={`absolute right-0.5 bottom-0.5 z-10 flex size-13 items-center justify-center rounded-full border-[3px] border-accent-fort text-base font-black text-texte shadow-bonbon transition-[transform,opacity,translate,scale] duration-300 ease-out hover:-translate-y-0.5 hover:scale-110 after:pointer-events-none after:absolute after:left-1/2 after:bottom-[calc(100%+8px)] after:-translate-x-1/2 after:rounded-xl after:bg-texte after:px-2.5 after:py-1.5 after:text-sm after:font-bold after:whitespace-nowrap after:text-surface after:opacity-0 after:content-[attr(data-tip)] hover:z-30 hover:after:opacity-100 focus-visible:z-30 focus-visible:after:opacity-100 disabled:opacity-50 ${
              pressed ? 'petale-actif ring-4 ring-accent-fort' : 'petale enabled:hover:petale-actif'
            } ${open ? 'opacity-100' : 'invisible scale-50 opacity-0'}`}
          >
            <span aria-hidden="true">{petal.symbol}</span>
          </button>
        );
      })}

      <button
        type="button"
        aria-label="Retirer le bouton accessibilité"
        tabIndex={open ? 0 : -1}
        onClick={() => setConfirming(true)}
        className={`absolute right-[4.5rem] bottom-1.5 z-10 flex size-11 items-center justify-center rounded-full border-2 border-bordure-forte bg-surface text-lg font-black text-texte shadow-doux transition-[opacity,translate] duration-300 hover:-translate-y-0.5 ${
          open ? 'opacity-100' : 'invisible opacity-0'
        }`}
      >
        <span aria-hidden="true">✕</span>
      </button>

      <button
        ref={mainRef}
        type="button"
        aria-label="Accessibilité"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={`relative z-20 flex size-14 items-center justify-center rounded-full onglet-actif text-3xl transition-[transform,translate] duration-300 hover:-translate-y-0.5 motion-safe:hover:animate-[wiggle_0.4s_ease-in-out_1] ${open ? 'rotate-90' : ''}`}
      >
        <span aria-hidden="true">♿</span>
      </button>

      {confirming && (
        <div
          role="dialog"
          aria-labelledby="retirer-bouton-titre"
          aria-describedby="retirer-bouton-aide"
          className="absolute right-0 bottom-20 w-72 max-w-[calc(100vw-2rem)] rounded-carte border-2 border-bordure bg-surface p-4 shadow-doux"
        >
          <h2 id="retirer-bouton-titre" className="text-base font-black text-texte">
            Retirer le bouton accessibilité ?
          </h2>
          <p id="retirer-bouton-aide" className="mt-1 text-sm text-texte-doux">
            Tes réglages restent appliqués. Tu pourras le remettre dans Compte → Paramètres → Accessibilité.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => {
                commit({ boutonMasque: true }, 'Bouton accessibilité retiré');
                setConfirming(false);
                setOpen(false);
              }}
              className="min-h-11 flex-1 rounded-full border-2 border-depasse bg-depasse-fond px-3 text-sm font-black text-depasse"
            >
              Retirer
            </button>
            <button
              ref={keepRef}
              type="button"
              onClick={() => setConfirming(false)}
              className="onglet-actif min-h-11 flex-1 rounded-full border-2 border-transparent px-3 text-sm font-black"
            >
              Garder
            </button>
          </div>
        </div>
      )}

      <p role="status" className="sr-only">
        {announcement}
      </p>
    </div>
  );
}
