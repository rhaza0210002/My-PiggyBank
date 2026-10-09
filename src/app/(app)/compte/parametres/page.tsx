"use client";

import { useEffect, useState } from 'react';
import AccessibilityButtonSetting from '@/components/features/accessibility/AccessibilityButtonSetting';
import PushReminderToggle from '@/components/features/forms/PushReminderToggle';
import {
  DEFAULT_USER_SETTINGS,
  getUserSettings,
  saveUserSettings,
  type UserSettings,
} from '@/services/userSettingsService';

const CARD = 'rounded-carte border-2 border-bordure bg-surface p-6 shadow-sm';

const OPTIONS: Array<{ key: keyof UserSettings; label: string; description: string }> = [
  {
    key: 'notify_reconcile',
    label: 'Opérations à rapprocher',
    description: 'Être prévenu quand des opérations importées attendent d’être vérifiées et pointées.',
  },
  {
    key: 'notify_budget_overrun',
    label: 'Dépassement de budget',
    description: 'Être prévenu quand les dépenses d’une catégorie dépassent le budget du mois.',
  },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;

    getUserSettings()
      .then((loaded) => {
        if (isCurrent) setSettings(loaded);
      })
      .catch((loadError: unknown) => {
        if (!isCurrent) return;
        setError(loadError instanceof Error ? loadError.message : 'Impossible de charger tes préférences.');
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  const toggle = async (key: keyof UserSettings) => {
    const previous = settings;
    const next = { ...settings, [key]: !settings[key] };

    setSettings(next);
    setIsSaving(true);
    setError(null);
    try {
      await saveUserSettings(next);
    } catch (saveError) {
      setSettings(previous);
      setError(saveError instanceof Error ? saveError.message : 'Enregistrement impossible.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-5xl flex-col gap-4 px-4 py-10 sm:px-6 lg:px-8">
      <div className={CARD}>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent-fort">Paramètres</p>
        <h1 className="mt-2 text-2xl font-bold text-texte">Tes préférences de suivi</h1>
      </div>

      <section aria-labelledby="notif-prefs-title" className={CARD}>
        <h2 id="notif-prefs-title" className="text-lg font-bold text-texte">Notifications</h2>

        {error && (
          <p role="alert" className="mt-3 rounded-lg border-2 border-depasse bg-depasse-fond p-3 text-sm font-semibold text-depasse">
            {error}
          </p>
        )}

        {isLoading ? (
          <p className="mt-3 text-sm text-texte-doux" role="status">Chargement…</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {OPTIONS.map((option) => (
              <li key={option.key}>
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={settings[option.key]}
                    disabled={isSaving}
                    onChange={() => void toggle(option.key)}
                    className="mt-1 h-4 w-4 accent-accent-fort"
                  />
                  <span>
                    <span className="block text-sm font-bold text-texte">{option.label}</span>
                    <span className="block text-sm text-texte-doux">{option.description}</span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}

        <PushReminderToggle />
      </section>

      <section aria-labelledby="a11y-prefs-title" className={CARD}>
        <h2 id="a11y-prefs-title" className="text-lg font-bold text-texte">Accessibilité</h2>
        <div className="mt-3">
          <AccessibilityButtonSetting />
        </div>
      </section>
    </div>
  );
}
