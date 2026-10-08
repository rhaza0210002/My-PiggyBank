"use client";

import { useState } from 'react';
import { archiveMonth } from '@/services/archiveService';
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
      <p className="rounded-xl border border-[#a8d0b9] bg-[#eaf5ee] px-3 py-2 text-center text-sm font-semibold text-[#1f4d25]">
        <span aria-hidden="true">🗄️ </span>
        Mois archivé : seuls les totaux par catégorie sont conservés. Ton budget et tes points restent intacts.
      </p>
    );
  }

  const blocker = getArchiveBlocker(transactions);
  if (blocker) return null;

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
    <section aria-label="Archiver le mois" className="rounded-2xl border-2 border-dashed border-[#d8b6a5] bg-white/50 p-3 text-center">
      {!isConfirming ? (
        <>
          <p className="text-sm font-semibold text-[#5d4d44]">
            Tout est pointé : tu peux ne garder que les totaux de {monthLabel.toLowerCase()} et effacer le détail de ton relevé.
          </p>
          <button
            type="button"
            onClick={() => setIsConfirming(true)}
            className="mt-2 min-h-11 rounded-xl border-2 border-[#d8b7a5] bg-[#fff8f2] px-4 text-sm font-bold text-[#5a473d] transition hover:bg-[#F8D5CB] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#5b473d]"
          >
            <span aria-hidden="true">🗄️ </span>Archiver {monthLabel.toLowerCase()}
          </button>
        </>
      ) : (
        <div role="alertdialog" aria-labelledby="archive-confirm-title" aria-describedby="archive-confirm-text">
          <p id="archive-confirm-title" className="text-sm font-black text-[#5d4d44]">
            Effacer le détail de {monthLabel.toLowerCase()} {year} ?
          </p>
          <p id="archive-confirm-text" className="mt-1 text-sm text-[#5d4d44]">
            Les {transactions.length} opérations bancaires de ce mois seront supprimées définitivement. Restent : le total réel par
            catégorie, ton budget et tes points. Si tu réimportes ce relevé, ce mois sera ignoré.
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={confirm}
              disabled={isBusy}
              className="min-h-11 rounded-xl border-2 border-[#a3452a] bg-[#e59a86] px-4 text-sm font-black text-[#3d2a21] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#5b473d] disabled:opacity-60"
            >
              {isBusy ? 'Archivage…' : 'Oui, effacer le détail'}
            </button>
            <button
              type="button"
              onClick={() => setIsConfirming(false)}
              disabled={isBusy}
              className="min-h-11 rounded-xl border-2 border-[#d8b7a5] bg-white px-4 text-sm font-bold text-[#5a473d] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#5b473d]"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
      {error && (
        <p role="alert" className="mt-2 text-sm font-semibold text-[#9c3633]">{error}</p>
      )}
    </section>
  );
}
