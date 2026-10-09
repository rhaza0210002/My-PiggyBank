"use client";

import { useEffect, useState } from 'react';
import { loadPrefs, savePrefs } from '@/utils/accessibilityPrefs';

/** Réglage « Afficher le bouton » (Compte → Paramètres) : on y remet le bouton retiré depuis la fleur. */
export default function AccessibilityButtonSetting() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisible(!loadPrefs().boutonMasque);
  }, []);

  const change = (checked: boolean) => {
    setVisible(checked);
    savePrefs({ ...loadPrefs(), boutonMasque: !checked });
  };

  return (
    <label className="flex min-h-11 cursor-pointer items-start gap-3">
      <input
        type="checkbox"
        checked={visible}
        onChange={(event) => change(event.target.checked)}
        className="mt-1 h-4 w-4 accent-accent-fort"
      />
      <span>
        <span className="block text-sm font-bold text-texte">Afficher le bouton d’accessibilité</span>
        <span className="block text-sm text-texte-doux">
          Le bouton ♿ en bas de l’écran ouvre les réglages de police, de zoom, de contraste et d’animations. Tes réglages
          restent appliqués même quand le bouton est masqué.
        </span>
      </span>
    </label>
  );
}
