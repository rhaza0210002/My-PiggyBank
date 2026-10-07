"use client";

import { useState, type ChangeEvent } from 'react';
import Link from 'next/link';
import CsvTransactionsTable from '@/components/features/tables/CsvTransactionsTable';
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
    <main className="min-h-screen bg-[#ebcfc6] px-4 py-6 text-[#5b473d] sm:px-6 lg:px-10">

      {/* Navigation de retour */}
      <div className="flex justify-start mb-6">
        <Link
          href="/"
          aria-label="Retour au bilan budgétaire"
          className="rounded-[1.25rem] border-[3px] border-[#e4a58f] bg-[#e59a86] px-5 py-2.5 text-center text-[1rem] font-bold text-[#fff8f5] shadow-[0_4px_0_rgba(171,98,77,0.85)] transition-transform hover:translate-y-[2px] focus:outline-none focus:ring-2 focus:ring-[#5b473d]"
        >
          ← Retour au Bilan
        </Link>
      </div>

      <div className="mx-auto max-w-[1200px] rounded-[2.2rem] border-[3px] border-[#d8b6a5] bg-[#f2e6d8] p-4 shadow-[inset_0_0_0_3px_rgba(255,255,255,0.18)] sm:p-6 space-y-6">

        <h1 className="text-[clamp(1.5rem,2.5vw,2.4rem)] font-black tracking-[-0.05em] text-[#5d4d44] px-2">
          Rapprochement Bancaire — Import CSV & Catégorisation
        </h1>

        {/* Zone d'importation de fichier */}
        <div className="rounded-[2rem] border-[3px] border-[#d7b59d] border-dashed bg-[#f5eadf] p-6 text-center shadow-[0_3px_0_rgba(140,103,86,0.12)]">
          <label className="cursor-pointer flex flex-col items-center justify-center space-y-3 focus-within:ring-2 focus-within:ring-[#5b473d] rounded-xl p-2">
            <div className="rounded-full bg-[#e59a86] p-4 text-white shadow-md" aria-hidden="true">
              📂
            </div>
            <span className="text-[1.2rem] font-bold text-[#5a473d]">
              {isLoadingMappings
                ? 'Chargement des catégories et libellés...'
                : fileName
                  ? `Fichier sélectionné : ${fileName}`
                  : "Glisse ton fichier CSV ici ou clique pour parcourir"}
            </span>
            <span className="text-[0.95rem] italic text-[#8c7366]">
              Traitement local sécurisé (aucun fichier brut stocké en base de données)
            </span>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              aria-label="Sélectionner un fichier CSV de banque"
              className="hidden"
            />
          </label>
          {error && <p role="alert" className="mt-3 text-red-600 font-semibold">{error}</p>}
        </div>

        <CsvTransactionsTable transactions={transactions} />

      </div>
    </main>
  );
}