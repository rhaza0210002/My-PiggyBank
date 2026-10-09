"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getNotifications, type AppNotification } from '@/services/notificationService';
import { getUserSettings } from '@/services/userSettingsService';

const CARD = 'rounded-carte border-2 border-bordure bg-surface p-6 shadow-sm';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<AppNotification[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;

    getUserSettings()
      .then((settings) => getNotifications(settings))
      .then((loaded) => {
        if (isCurrent) setNotifications(loaded);
      })
      .catch((loadError: unknown) => {
        if (!isCurrent) return;
        setError(loadError instanceof Error ? loadError.message : 'Impossible de charger tes notifications.');
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-5xl flex-col gap-4 px-4 py-10 sm:px-6 lg:px-8">
      <div className={CARD}>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent-fort">Notifications</p>
        <h1 className="mt-2 text-2xl font-bold text-texte">Ce qui demande ton attention</h1>
        <p className="mt-2 text-sm text-texte-doux">
          Choisis ce que tu veux voir dans les{' '}
          <Link href="/compte/parametres" className="font-semibold text-accent-fort underline">paramètres</Link>.
        </p>
      </div>

      {error && (
        <p role="alert" className="rounded-lg border-2 border-depasse bg-depasse-fond p-3 text-sm font-semibold text-depasse">
          {error}
        </p>
      )}

      {!notifications && !error && (
        <p className="text-sm font-semibold text-texte-doux" role="status">Chargement…</p>
      )}

      {notifications && notifications.length === 0 && (
        <div className={CARD}>
          <p className="text-lg font-bold text-texte">Tout est à jour.</p>
          <p className="mt-1 text-sm text-texte-doux">Aucune notification pour le moment.</p>
        </div>
      )}

      {notifications && notifications.length > 0 && (
        <ul className="space-y-3">
          {notifications.map((notification) => (
            <li
              key={notification.id}
              className={`${CARD} ${notification.level === 'warning' ? 'border-l-8 border-l-accent' : 'border-l-8 border-l-bordure'}`}
            >
              <h2 className="text-base font-bold text-texte">{notification.title}</h2>
              <p className="mt-1 text-sm text-texte-doux">{notification.detail}</p>
              {notification.href && (
                <Link href={notification.href} className="mt-2 inline-block text-sm font-semibold text-accent-fort underline">
                  Voir
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
