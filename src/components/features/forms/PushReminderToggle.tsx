"use client";

import { useEffect, useState } from 'react';
import { disablePush, enablePush, getPushStatus, type PushStatus } from '@/services/pushService';

const MESSAGES: Record<PushStatus, string> = {
  unsupported:
    'Ton navigateur ne gère pas les rappels. Sur iPhone, ajoute d’abord l’app à l’écran d’accueil (Partager, puis « Sur l’écran d’accueil »), puis reviens ici.',
  denied: 'Les notifications sont bloquées pour ce site dans ton navigateur. Autorise-les dans ses réglages pour activer les rappels.',
  off: 'Un rappel par jour au maximum s’il te reste des opérations à pointer, et une alerte quand un budget est dépassé. Jamais de montant ni de libellé dedans.',
  on: 'Rappels activés sur cet appareil : un rappel par jour au maximum s’il te reste des opérations à pointer, et une alerte quand un budget est dépassé. Les deux se règlent plus haut.',
};

/** Active ou coupe les rappels sur l'appareil en cours (chaque appareil s'abonne séparément). */
export default function PushReminderToggle() {
  const [status, setStatus] = useState<PushStatus | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;
    getPushStatus()
      .then((current) => {
        if (isCurrent) setStatus(current);
      })
      .catch(() => {
        if (isCurrent) setStatus('unsupported');
      });
    return () => {
      isCurrent = false;
    };
  }, []);

  const toggle = async () => {
    if (!status) return;
    setIsBusy(true);
    setError(null);
    try {
      setStatus(status === 'on' ? await disablePush() : await enablePush());
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : 'Action impossible.');
    } finally {
      setIsBusy(false);
    }
  };

  const canToggle = status === 'on' || status === 'off';

  return (
    <div className="mt-4 rounded-2xl border-[1.5px] border-bordure bg-surface/60 p-4">
      <h3 className="text-sm font-bold text-texte">
        <span aria-hidden="true">🔔 </span>Rappels sur cet appareil
      </h3>
      <p className="mt-1 text-sm text-texte-doux" role="status">
        {status ? MESSAGES[status] : 'Vérification…'}
      </p>
      {error && (
        <p role="alert" className="mt-2 text-sm font-semibold text-depasse">{error}</p>
      )}
      {canToggle && (
        <button
          type="button"
          onClick={toggle}
          disabled={isBusy}
          aria-pressed={status === 'on'}
          className="mt-3 min-h-11 rounded-xl border-[1.5px] border-bordure bg-surface px-4 text-sm font-bold text-texte transition hover:bg-accent-doux focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-60"
        >
          {isBusy ? 'Un instant…' : status === 'on' ? 'Couper les rappels' : 'Activer les rappels'}
        </button>
      )}
    </div>
  );
}
