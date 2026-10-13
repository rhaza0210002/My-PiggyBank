"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { reportClientError, reportDisplayedError, sendFeedback } from '@/services/testFeedbackClient';

const WHO_KEY = 'piggy-testeur';

/**
 * Séance de test seulement : note les erreurs du navigateur et propose « Signaler un souci ».
 * Rien n'est envoyé hors du PC qui fait tourner l'app (voir /api/retours).
 */
export default function TestFeedback() {
  const id = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [message, setMessage] = useState('');
  const [who, setWho] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  useEffect(() => {
    const onError = (event: ErrorEvent) => reportClientError(event.error ?? event.message);
    const onRejection = (event: PromiseRejectionEvent) => reportClientError(event.reason);
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);

    // Les erreurs gérées par l'app s'affichent toutes dans des zones role="alert" : on note leur texte.
    const shown = new WeakMap<Element, string>();
    const scan = () => {
      document.querySelectorAll('[role="alert"]').forEach((alert) => {
        const text = alert.textContent ?? '';
        if (shown.get(alert) === text) return;
        shown.set(alert, text);
        reportDisplayedError(text);
      });
    };
    const observer = new MutationObserver(scan);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    scan();

    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
      observer.disconnect();
    };
  }, []);

  const open = () => {
    try {
      setWho(localStorage.getItem(WHO_KEY) ?? '');
    } catch {
      // Stockage indisponible : le prénom reste à écrire.
    }
    setState('idle');
    dialogRef.current?.showModal();
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!message.trim() || state === 'sending') return;
    setState('sending');
    try {
      localStorage.setItem(WHO_KEY, who.trim());
    } catch {
      // Sans stockage, le prénom sera simplement redemandé.
    }
    const ok = await sendFeedback({ kind: 'signalement', message, who: who.trim() || undefined });
    setState(ok ? 'sent' : 'error');
    if (ok) setMessage('');
  };

  return (
    <>
      <button
        type="button"
        onClick={open}
        className="fixed bottom-20 left-4 z-40 min-h-12 rounded-full border-2 border-texte bg-piece px-4 text-sm font-black text-texte shadow-bonbon transition-transform hover:-translate-y-0.5 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus md:bottom-6 md:left-6"
      >
        Signaler un souci
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={`${id}-title`}
        className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-carte border-2 border-texte bg-surface p-5 text-texte shadow-bonbon backdrop:bg-texte/40"
      >
        <h2 id={`${id}-title`} className="text-xl font-black">Signaler un souci</h2>
        <p className="mt-1 text-sm text-texte-doux">
          Dis ce que tu faisais et ce qui s’est passé. La page et l’heure sont ajoutées toutes seules.
        </p>
        <form onSubmit={submit} className="mt-3 flex flex-col gap-3">
          <label htmlFor={`${id}-message`} className="text-sm font-bold">Qu’est-ce qui s’est passé ?</label>
          <textarea
            id={`${id}-message`}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            required
            maxLength={2000}
            rows={5}
            className="rounded-xl border-[1.5px] border-bordure-forte bg-surface p-2.5 text-sm text-texte"
          />
          <label htmlFor={`${id}-who`} className="text-sm font-bold">Ton prénom (facultatif)</label>
          <input
            id={`${id}-who`}
            value={who}
            onChange={(event) => setWho(event.target.value)}
            maxLength={40}
            autoComplete="given-name"
            className="min-h-11 rounded-xl border-[1.5px] border-bordure-forte bg-surface px-3 text-sm text-texte"
          />
          <p role="status" className="min-h-5 text-sm font-bold">
            {state === 'sent' && <span className="text-ok">Merci, c’est noté !</span>}
            {state === 'error' && <span className="text-depasse">Envoi impossible pour le moment. Réessaie dans une minute.</span>}
          </p>
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="min-h-11 rounded-full border-[1.5px] border-bordure-forte bg-surface px-4 text-sm font-bold"
            >
              Fermer
            </button>
            <button
              type="submit"
              disabled={state === 'sending' || !message.trim()}
              className="min-h-11 rounded-full border-2 border-texte bg-accent px-4 text-sm font-black text-sur-accent shadow-bonbon disabled:opacity-60"
            >
              {state === 'sending' ? 'Envoi…' : 'Envoyer'}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
