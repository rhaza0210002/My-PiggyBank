"use client";

import { useEffect, useState } from 'react';
import {
  DEFAULT_USER_SETTINGS,
  getUserSettings,
  saveUserSettings,
  type UserSettings,
} from '@/services/userSettingsService';

const CARD = 'rounded-[2rem] border border-[#e5c4b4] bg-[#fff8f2] p-6 shadow-sm';

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
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-4 px-4 py-10 sm:px-6 lg:px-8">
      <div className={CARD}>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#c86445]">Paramètres</p>
        <h1 className="mt-2 text-2xl font-bold text-[#5a4d41]">Tes préférences de suivi</h1>
      </div>

      <section aria-labelledby="notif-prefs-title" className={CARD}>
        <h2 id="notif-prefs-title" className="text-lg font-bold text-[#5a4d41]">Notifications</h2>

        {error && (
          <p role="alert" className="mt-3 rounded-lg border border-red-300 bg-red-50 p-3 text-sm font-semibold text-red-800">
            {error}
          </p>
        )}

        {isLoading ? (
          <p className="mt-3 text-sm text-[#8c7a6b]" role="status">Chargement…</p>
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
                    className="mt-1 h-4 w-4 accent-[#c86445]"
                  />
                  <span>
                    <span className="block text-sm font-bold text-[#5a4d41]">{option.label}</span>
                    <span className="block text-sm text-[#8c7a6b]">{option.description}</span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
