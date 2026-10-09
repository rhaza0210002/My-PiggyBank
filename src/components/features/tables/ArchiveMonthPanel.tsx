"use client";

import { useState } from 'react';
import { archiveMonth } from '@/services/archiveService';
import { isDemoActive } from '@/services/demoStore';
import { getArchiveBlocker, isArchivedList, type ArchivableTransaction } from '@/utils/archive';

interface ArchiveMonthPanelProps {
  year: number;
  monthIndex: number;
  monthLabel: string;
  transactions: readonly (ArchivableTransaction & { id: string })[];
  /** Appelé une fois le mois archivé, pour recharger l'écran. */
  onArchived: () => void;
}

/** Garde les totaux du mois et efface le détail des opérations bancaires : toujours sur demande, avec confirmation. */
export default function ArchiveMonthPanel({ year, monthIndex, monthLabel, transactions, onArchived }: ArchiveMonthPanelProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isArchivedList(transactions)) {
    return (
      <p className="rounded-xl border-[1.5px] border-bordure bg-ok-fond px-3 py-2 text-center text-sm font-semibold text-ok">
        <span aria-hidden="true">🗄️ </span>
        Mois archivé : seuls les totaux par catégorie sont conservés. Ton budget et tes points restent intacts.
      </p>
    );
  }

  const blocker = getArchiveBlocker(transactions);
  // Les lignes de l'exemple sont fictives : on ne propose pas d'archiver le vrai mois.
  if (blocker || isDemoActive()) return null;

  const confirm = async () => {
    setIsBusy(true);
    setError(null);
    try {
      await archiveMonth(year, monthIndex);
      setIsConfirming(false);
      onArchived();
    } catch (archiveError) {
      setError(archiveError instanceof Error ? archiveError.message : 'Archivage impossible.');
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <section aria-label="Archiver le mois" className="rounded-2xl border-[1.5px] border-dashed border-bordure bg-surface/50 p-3 text-center">
      {!isConfirming ? (
        <>
          <p className="text-sm font-semibold text-texte">
            Tout est pointé : tu peux ne garder que les totaux de {monthLabel.toLowerCase()} et effacer le détail de ton relevé.
          </p>
          <button
            type="button"
            onClick={() => setIsConfirming(true)}
            className="mt-2 min-h-11 rounded-xl border-[1.5px] border-bordure bg-surface px-4 text-sm font-bold text-texte transition hover:bg-accent-doux focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            <span aria-hidden="true">🗄️ </span>Archiver {monthLabel.toLowerCase()}
          </button>
        </>
      ) : (
        <div role="alertdialog" aria-labelledby="archive-confirm-title" aria-describedby="archive-confirm-text">
          <p id="archive-confirm-title" className="text-sm font-black text-texte">
            Effacer le détail de {monthLabel.toLowerCase()} {year} ?
          </p>
          <p id="archive-confirm-text" className="mt-1 text-sm text-texte">
            Les {transactions.length} opérations bancaires de ce mois seront supprimées définitivement. Restent : le total réel par
            catégorie, ton budget et tes points. Si tu réimportes ce relevé, ce mois sera ignoré.
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={confirm}
              disabled={isBusy}
              className="min-h-11 rounded-xl border-[1.5px] border-accent-fort bg-accent px-4 text-sm font-black text-sur-accent focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-60"
            >
              {isBusy ? 'Archivage…' : 'Oui, effacer le détail'}
            </button>
            <button
              type="button"
              onClick={() => setIsConfirming(false)}
              disabled={isBusy}
              className="min-h-11 rounded-xl border-[1.5px] border-bordure bg-surface px-4 text-sm font-bold text-texte focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
      {error && (
        <p role="alert" className="mt-2 text-sm font-semibold text-depasse">{error}</p>
      )}
    </section>
  );
}
