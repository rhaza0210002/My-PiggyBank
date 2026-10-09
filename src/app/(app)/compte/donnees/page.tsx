"use client";

import { useId, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ScreenCard from '@/components/ui/ScreenCard';
import { LEGAL_ROUTES, ROUTES } from '@/constants/routes';
import { deleteMyAccount, exportMyData } from '@/services/personalDataService';
import { exportFileName } from '@/utils/dataExport';

const CARD = 'rounded-3xl border-[1.5px] border-bordure bg-surface p-4 shadow-sm';
const BUTTON =
  'min-h-11 rounded-2xl border-[1.5px] border-bordure bg-accent-doux px-4 text-sm font-semibold text-accent-fort transition-colors hover:bg-accent-doux focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-60';
const CONFIRMATION_WORD = 'SUPPRIMER';

export default function MyDataPage() {
  const router = useRouter();
  const confirmId = useId();
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    setExportMessage(null);
    try {
      const data = await exportMyData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = exportFileName(new Date());
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setExportMessage({ tone: 'success', text: `Fichier téléchargé : ${data.transactions.length} opérations, ${data.budget.length} lignes de budget.` });
    } catch (error) {
      setExportMessage({ tone: 'error', text: error instanceof Error ? error.message : 'Export impossible.' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDelete = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (confirmation.trim().toUpperCase() !== CONFIRMATION_WORD || isDeleting) return;

    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteMyAccount();
      router.replace(ROUTES.login);
      router.refresh();
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'Suppression impossible.');
      setIsDeleting(false);
    }
  };

  return (
    <ScreenCard title="Mes données" icon="🔐" subtitle="Tu gardes la main : récupère-les ou supprime-les, quand tu veux.">
      <div className="grid gap-3 md:grid-cols-2">
        <section aria-labelledby="export-title" className={CARD}>
          <h2 id="export-title" className="text-lg font-bold text-texte">Récupérer mes données</h2>
          <p className="mt-1 text-sm text-texte-doux">
            Télécharge un fichier lisible (JSON) avec ton profil, tes opérations, ton budget, tes règles de libellé et
            tes réglages.
          </p>
          <button type="button" onClick={handleExport} disabled={isExporting} className={`${BUTTON} mt-3`}>
            {isExporting ? 'Préparation…' : 'Télécharger mes données'}
          </button>
          {exportMessage && (
            <p
              role={exportMessage.tone === 'error' ? 'alert' : 'status'}
              className={`mt-3 text-sm font-semibold ${exportMessage.tone === 'error' ? 'text-depasse' : 'text-ok'}`}
            >
              {exportMessage.text}
            </p>
          )}
        </section>

        <section aria-labelledby="delete-title" className={`${CARD} border-bordure`}>
          <h2 id="delete-title" className="text-lg font-bold text-texte">Supprimer mon compte</h2>
          <p className="mt-1 text-sm text-texte-doux">
            Ton profil, tes opérations, ton budget, tes règles et tes réglages sont effacés <strong>définitivement</strong>.
            Pense à télécharger tes données avant.
          </p>

          {!isConfirming ? (
            <button type="button" onClick={() => setIsConfirming(true)} className={`${BUTTON} mt-3`}>
              Supprimer mon compte…
            </button>
          ) : (
            <form onSubmit={handleDelete} className="mt-3 space-y-2">
              <label htmlFor={confirmId} className="block text-sm font-semibold text-texte">
                Pour confirmer, écris {CONFIRMATION_WORD}
              </label>
              <input
                id={confirmId}
                type="text"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                autoComplete="off"
                autoFocus
                className="min-h-11 w-full rounded-xl border-[1.5px] border-bordure-forte bg-surface px-3 text-texte"
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={isDeleting || confirmation.trim().toUpperCase() !== CONFIRMATION_WORD}
                  className="min-h-11 rounded-2xl border-[1.5px] border-accent-fort bg-depasse px-4 text-sm font-bold text-surface focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-50"
                >
                  {isDeleting ? 'Suppression…' : 'Supprimer définitivement'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsConfirming(false);
                    setConfirmation('');
                    setDeleteError(null);
                  }}
                  className={BUTTON}
                >
                  Annuler
                </button>
              </div>
              {deleteError && (
                <p role="alert" className="text-sm font-semibold text-depasse">{deleteError}</p>
              )}
            </form>
          )}
        </section>

        <section aria-labelledby="rights-title" className={`${CARD} md:col-span-2`}>
          <h2 id="rights-title" className="text-lg font-bold text-texte">Tes droits et nos engagements</h2>
          <ul className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
            <li>
              <Link href={LEGAL_ROUTES.privacy} className="inline-flex min-h-8 items-center font-semibold text-accent-fort underline">
                Politique de confidentialité
              </Link>
            </li>
            <li>
              <Link href={LEGAL_ROUTES.cookies} className="inline-flex min-h-8 items-center font-semibold text-accent-fort underline">
                Cookies et stockage local
              </Link>
            </li>
            <li>
              <Link href={LEGAL_ROUTES.terms} className="inline-flex min-h-8 items-center font-semibold text-accent-fort underline">
                Conditions d’utilisation
              </Link>
            </li>
            <li>
              <Link href={LEGAL_ROUTES.legalNotice} className="inline-flex min-h-8 items-center font-semibold text-accent-fort underline">
                Mentions légales
              </Link>
            </li>
          </ul>
          <p className="mt-2 text-xs text-texte-doux">
            Pseudo et mot de passe se modifient dans la page Profil. Pour toute autre demande (limitation, opposition),
            utilise le contact indiqué dans la politique de confidentialité.
          </p>
        </section>
      </div>
    </ScreenCard>
  );
}
