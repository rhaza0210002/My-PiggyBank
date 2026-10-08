"use client";

import { useState, type ChangeEvent } from 'react';
import Link from 'next/link';
import CsvTransactionsTable from '@/components/features/tables/CsvTransactionsTable';
import ScreenCard from '@/components/ui/ScreenCard';
import { ROUTES } from '@/constants/routes';
import { SocieteGeneraleParser, type BankTransaction } from '@/services/csvParser';
import { getLibelleTransacts } from '@/services/transactionCategoryService';

export default function CsvUploaderPage() {
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingMappings, setIsLoadingMappings] = useState(false);
  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError(null);
    setTransactions([]);
    setIsLoadingMappings(true);

    const reader = new FileReader();
    reader.readAsText(file, 'windows-1252');

    reader.onload = async (fileEvent: ProgressEvent<FileReader>) => {
      try {
        const text = fileEvent.target?.result as string;
        if (!text) {
          setError("Impossible de lire le contenu du fichier.");
          return;
        }

        const transactionLabels = await getLibelleTransacts();
        if (transactionLabels.length === 0) {
          throw new Error(
            "La table libelle_transacts ne contient aucune règle visible. Exécutez supabase/seed-libelle-transacts.sql dans Supabase, puis vérifiez la politique RLS SELECT de cette table.",
          );
        }

        const parser = new SocieteGeneraleParser(text, transactionLabels);
        const parsed = parser.parse();

        if (parsed.length === 0) {
          setError("Aucune transaction valide n'a pu être lue dans ce fichier.");
          return;
        }

        setTransactions(parsed);
      } catch (err: unknown) {
        console.error(err);
        setError(
          err instanceof Error
            ? err.message
            : "Erreur lors de la lecture du fichier CSV.",
        );
      } finally {
        setIsLoadingMappings(false);
      }
    };
  };

  return (
    <ScreenCard
      flow
      title="Importer ton relevé"
      subtitle="Dépose le fichier CSV de ta banque : les opérations reconnues sont rangées pour toi."
    >
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="rounded-[1.5rem] border-[3px] border-dashed border-[#d7b59d] bg-[#f5eadf] p-4 text-center sm:p-6">
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl p-2 focus-within:ring-2 focus-within:ring-[#5b473d]">
            <span className="rounded-full bg-[#e59a86] p-3 text-2xl text-white shadow-md" aria-hidden="true">
              📂
            </span>
            <span className="text-lg font-bold text-[#5a473d]">
              {isLoadingMappings
                ? 'Chargement des catégories…'
                : fileName
                  ? `Fichier : ${fileName}`
                  : 'Choisir mon fichier CSV'}
            </span>
            <span className="text-sm italic text-[#6b574c]">
              Lu sur ton appareil : le fichier brut n’est jamais envoyé ni stocké.
            </span>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              aria-label="Sélectionner un fichier CSV de banque"
              className="sr-only"
            />
          </label>
          {error && <p role="alert" className="mt-3 font-semibold text-red-700">{error}</p>}
        </div>

        <CsvTransactionsTable transactions={transactions} />

        {transactions.length > 0 && (
          <p className="text-center text-sm text-[#6b574c]">
            Une fois les transactions enregistrées, passe à l’étape suivante.{' '}
            <Link href={ROUTES.reconciliation} className="font-black text-[#8c4a38] underline underline-offset-4">
              Pointer les opérations →
            </Link>
          </p>
        )}
      </div>
    </ScreenCard>
  );
}
