"use client";

import { useEffect, useState } from 'react';
import { disablePush, enablePush, getPushStatus, type PushStatus } from '@/services/pushService';

const MESSAGES: Record<PushStatus, string> = {
  unsupported:
    'Ton navigateur ne gère pas les rappels. Sur iPhone, ajoute d’abord l’app à l’écran d’accueil (Partager, puis « Sur l’écran d’accueil »), puis reviens ici.',
  denied: 'Les notifications sont bloquées pour ce site dans ton navigateur. Autorise-les dans ses réglages pour activer les rappels.',
  off: 'Un seul rappel par jour au maximum, seulement s’il te reste des opérations à pointer. Jamais de montant ni de libellé dedans.',
  on: 'Rappels activés sur cet appareil : un seul par jour au maximum, seulement s’il te reste des opérations à pointer.',
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
    <div className="mt-4 rounded-2xl border border-[#e5c4b4] bg-white/60 p-4">
      <h3 className="text-sm font-bold text-[#5a4d41]">
        <span aria-hidden="true">🔔 </span>Rappels sur cet appareil
      </h3>
      <p className="mt-1 text-sm text-[#6b574c]" role="status">
        {status ? MESSAGES[status] : 'Vérification…'}
      </p>
      {error && (
        <p role="alert" className="mt-2 text-sm font-semibold text-red-800">{error}</p>
      )}
      {canToggle && (
        <button
          type="button"
          onClick={toggle}
          disabled={isBusy}
          aria-pressed={status === 'on'}
          className="mt-3 min-h-11 rounded-xl border-2 border-[#d8b7a5] bg-[#fff8f2] px-4 text-sm font-bold text-[#5a473d] transition hover:bg-[#F8D5CB] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#5b473d] disabled:opacity-60"
        >
          {isBusy ? 'Un instant…' : status === 'on' ? 'Couper les rappels' : 'Activer les rappels'}
        </button>
      )}
    </div>
  );
}
