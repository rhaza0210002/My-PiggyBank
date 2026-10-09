"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getNotifications, type AppNotification } from '@/services/notificationService';
import { getUserSettings } from '@/services/userSettingsService';

const CARD = 'rounded-carte border border-[#e5c4b4] bg-[#fff8f2] p-6 shadow-sm';

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
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#a3452a]">Notifications</p>
        <h1 className="mt-2 text-2xl font-bold text-[#5a4d41]">Ce qui demande ton attention</h1>
        <p className="mt-2 text-sm text-[#6b574c]">
          Choisis ce que tu veux voir dans les{' '}
          <Link href="/compte/parametres" className="font-semibold text-[#a3452a] underline">paramètres</Link>.
        </p>
      </div>

      {error && (
        <p role="alert" className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm font-semibold text-red-800">
          {error}
        </p>
      )}

      {!notifications && !error && (
        <p className="text-sm font-semibold text-[#6b574c]" role="status">Chargement…</p>
      )}

      {notifications && notifications.length === 0 && (
        <div className={CARD}>
          <p className="text-lg font-bold text-[#5a4d41]">Tout est à jour.</p>
          <p className="mt-1 text-sm text-[#6b574c]">Aucune notification pour le moment.</p>
        </div>
      )}

      {notifications && notifications.length > 0 && (
        <ul className="space-y-3">
          {notifications.map((notification) => (
            <li
              key={notification.id}
              className={`${CARD} ${notification.level === 'warning' ? 'border-l-8 border-l-[#d8846d]' : 'border-l-8 border-l-[#83b5a6]'}`}
            >
              <h2 className="text-base font-bold text-[#5a4d41]">{notification.title}</h2>
              <p className="mt-1 text-sm text-[#6b574c]">{notification.detail}</p>
              {notification.href && (
                <Link href={notification.href} className="mt-2 inline-block text-sm font-semibold text-[#a3452a] underline">
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
