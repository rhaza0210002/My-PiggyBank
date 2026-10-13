"use client";

import { useEffect, useRef, useState } from 'react';
import {
  DEFAULT_FORM,
  DEFAULT_LINES,
  LINE_SETTINGS,
  FONT_CHOICES,
  WORKSHOP_COLORS,
  describeChanges,
  workshopVariables,
  type FontId,
  type WorkshopSettings,
} from './workshopSettings';

const STORAGE_KEY = 'piggy-atelier';
const SEND_DELAY_MS = 600;

const FIELD = 'min-h-9 rounded-lg border-[1.5px] border-bordure-forte bg-surface px-2 text-sm text-texte';
const BUTTON =
  'min-h-11 flex-1 rounded-full border-2 border-texte px-3 text-sm font-black text-texte focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus';

function readStored(): WorkshopSettings | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as WorkshopSettings) : null;
  } catch {
    return null;
  }
}

function store(settings: WorkshopSettings | null): void {
  try {
    if (settings) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Stockage refusé : les réglages tiennent jusqu'au rechargement.
  }
}

/** Un champ couleur n'accepte que la forme longue à six chiffres : la forme courte est dépliée. */
function toLongHex(value: string): string {
  const short = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(value);
  return short ? `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}` : value;
}

/** Les couleurs du thème actuel, lues dans la feuille de style (sans les réglages de l'atelier). */
function themeColors(): Record<string, string> {
  const root = document.documentElement;
  const saved = root.getAttribute('style');
  root.removeAttribute('style');
  const computed = getComputedStyle(root);
  const colors = Object.fromEntries(
    WORKSHOP_COLORS.map(({ token }) => [token, toLongHex(computed.getPropertyValue(`--color-${token}`).trim())]),
  );
  if (saved) root.setAttribute('style', saved);
  return colors;
}

function applyToPage(settings: WorkshopSettings | null): void {
  const root = document.documentElement;
  root.removeAttribute('style');
  if (!settings) return;
  for (const [name, value] of Object.entries(workshopVariables(settings))) root.style.setProperty(name, value);
  root.style.fontSize = `${settings.textScale}%`;
}

function send(event: Record<string, unknown>): void {
  void fetch('/api/atelier', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...event, page: window.location.pathname }),
  }).catch(() => {});
}

/**
 * Atelier de l'identité graphique, monté seulement en développement : un panneau qui change les couleurs,
 * l'arrondi et les polices de toute l'app en direct. Chaque réglage est envoyé à Claude (fichier local).
 */
export default function DesignWorkshop() {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<WorkshopSettings | null>(null);
  const [status, setStatus] = useState('');
  const sentRef = useRef<WorkshopSettings | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Les réglages en cours suivent la personne d'une page à l'autre.
  useEffect(() => {
    applyToPage(readStored());
  }, []);

  const openPanel = () => {
    const current = readStored() ?? { colors: themeColors(), ...DEFAULT_FORM };
    setSettings(current);
    sentRef.current = current;
    setOpen(true);
  };

  const update = (next: WorkshopSettings) => {
    setSettings(next);
    applyToPage(next);
    store(next);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const changes = sentRef.current ? describeChanges(sentRef.current, next) : [];
      sentRef.current = next;
      if (changes.length === 0) return;
      send({ type: 'reglage', changements: changes, reglages: next });
      setStatus(`Envoyé en direct : ${changes.join(' · ')}`);
    }, SEND_DELAY_MS);
  };

  const reset = () => {
    applyToPage(null);
    store(null);
    const fresh = { colors: themeColors(), ...DEFAULT_FORM };
    setSettings(fresh);
    sentRef.current = fresh;
    send({ type: 'retour', changements: ['Retour aux réglages actuels de l’app'] });
    setStatus('Retour aux réglages actuels.');
  };

  const keep = () => {
    if (!settings) return;
    send({ type: 'garder', reglages: settings });
    setStatus('C’est envoyé : je les applique dans l’app.');
  };

  return (
    <div className="fixed bottom-4 left-4 z-50 print:hidden">
      {!open ? (
        <button type="button" onClick={openPanel} className={`${BUTTON} bg-piece px-4 shadow-sticker-petit`}>
          Atelier
        </button>
      ) : (
        settings && (
          <section
            aria-label="Atelier de l’identité graphique"
            className="flex max-h-[80vh] w-72 flex-col gap-2 overflow-y-auto rounded-carte border-2 border-texte bg-surface p-3 text-sm text-texte shadow-sticker"
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-titre text-base font-black">Atelier</h2>
              <button type="button" onClick={() => setOpen(false)} className="min-h-9 rounded-full px-3 font-bold underline">
                Fermer
              </button>
            </div>
            <p className="text-xs text-texte-doux">Change un réglage : toute l’app suit, et je le reçois en direct.</p>

            {WORKSHOP_COLORS.map(({ token, label }) => (
              <label key={token} className="flex min-h-9 items-center justify-between gap-2 font-semibold">
                {label}
                <input
                  type="color"
                  value={settings.colors[token] ?? ''}
                  onChange={(event) => update({ ...settings, colors: { ...settings.colors, [token]: event.target.value } })}
                  className="h-8 w-12 cursor-pointer rounded-lg border-[1.5px] border-bordure-forte bg-surface"
                />
              </label>
            ))}

            <label className="flex min-h-9 items-center justify-between gap-2 font-semibold">
              Arrondi des cartes
              <input
                type="range"
                min={0.5}
                max={2.5}
                step={0.125}
                value={settings.radiusCard}
                onChange={(event) => update({ ...settings, radiusCard: Number(event.target.value) })}
              />
            </label>
            {LINE_SETTINGS.map(({ key, label, max }) => {
              const lines = settings.lines ?? DEFAULT_LINES;
              return (
                <label key={key} className="flex min-h-9 items-center justify-between gap-2 font-semibold">
                  <span>
                    {label} <span className="text-xs font-normal text-texte-doux">{lines[key]} px</span>
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={max}
                    step={0.5}
                    value={lines[key]}
                    onChange={(event) => update({ ...settings, lines: { ...lines, [key]: Number(event.target.value) } })}
                  />
                </label>
              );
            })}
            <label className="flex min-h-9 items-center justify-between gap-2 font-semibold">
              Taille du texte
              <input
                type="range"
                min={90}
                max={125}
                step={5}
                value={settings.textScale}
                onChange={(event) => update({ ...settings, textScale: Number(event.target.value) })}
              />
            </label>
            <label className="flex min-h-9 items-center justify-between gap-2 font-semibold">
              Police du texte
              <select
                value={settings.fontText}
                onChange={(event) => update({ ...settings, fontText: event.target.value as FontId })}
                className={FIELD}
              >
                {FONT_CHOICES.map((font) => (
                  <option key={font.id} value={font.id}>{font.label}</option>
                ))}
              </select>
            </label>
            <label className="flex min-h-9 items-center justify-between gap-2 font-semibold">
              Police des titres
              <select
                value={settings.fontTitle}
                onChange={(event) => update({ ...settings, fontTitle: event.target.value as FontId })}
                className={FIELD}
              >
                {FONT_CHOICES.map((font) => (
                  <option key={font.id} value={font.id}>{font.label}</option>
                ))}
              </select>
            </label>

            <div className="mt-1 flex gap-2">
              <button type="button" onClick={reset} className={`${BUTTON} bg-surface`}>
                Revenir à l’actuel
              </button>
              <button type="button" onClick={keep} className={`${BUTTON} bg-accent`}>
                Garder
              </button>
            </div>
            <p role="status" className="min-h-4 text-xs font-semibold text-ok">{status}</p>
          </section>
        )
      )}
    </div>
  );
}
