"use client";

import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import Link from 'next/link';
import CsvTransactionsTable from '@/components/features/tables/CsvTransactionsTable';
import ScreenCard from '@/components/ui/ScreenCard';
import { ROUTES } from '@/constants/routes';
import { SocieteGeneraleParser, type BankTransaction } from '@/services/csvParser';
import { scrollIntoZone } from '@/utils/scroll';
import { endDemo, isDemoActive } from '@/services/demoStore';
import { buildDemoTransactions, shouldConfirmReplaceDemo } from '@/utils/demoStatement';
import { getLibelleTransacts } from '@/services/transactionCategoryService';

export default function CsvUploaderPage() {
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingMappings, setIsLoadingMappings] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [demoSaved, setDemoSaved] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Sur un petit écran le résultat arrive sous la zone de dépôt, hors de vue : on y amène la personne.
  useEffect(() => {
    if (transactions.length === 0) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (resultsRef.current) scrollIntoZone(resultsRef.current, reduced ? 'auto' : 'smooth');
  }, [transactions]);

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (shouldConfirmReplaceDemo(isDemoActive(), false)) {
      if (!window.confirm('Ton exemple sera effacé. Continuer ?')) {
        event.target.value = '';
        return;
      }
      endDemo();
    }

    setDemoSaved(false);
    setFileName(file.name);
    setIsDemo(false);
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

  const showDemo = async () => {
    setDemoSaved(false);
    setError(null);
    setFileName(null);
    setIsLoadingMappings(true);
    try {
      setTransactions(buildDemoTransactions(await getLibelleTransacts()));
      setIsDemo(true);
    } catch {
      // Sans règles lisibles, l'exemple reste utile : il s'affiche simplement non catégorisé.
      setTransactions(buildDemoTransactions([]));
      setIsDemo(true);
    } finally {
      setIsLoadingMappings(false);
    }
  };

  return (
    <ScreenCard
      flow
      title="Importer ton relevé" icon="📥"
      subtitle="Dépose le CSV de ta banque : on range les opérations pour toi, tu vérifies, c’est tout."
    >
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="rounded-carte border-2 border-dashed border-bordure bg-surface-douce p-4 text-center sm:p-6">
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl p-2 focus-within:ring-2 focus-within:ring-focus">
            <span className="rounded-full bg-accent p-3 text-2xl text-surface shadow-md" aria-hidden="true">
              📂
            </span>
            <span className="text-lg font-bold text-texte">
              {isLoadingMappings
                ? 'Chargement des catégories…'
                : fileName
                  ? `Fichier : ${fileName}`
                  : 'Choisir mon fichier CSV'}
            </span>
            <span className="text-sm italic text-texte-doux">
              Ton fichier est lu sur ton appareil et n’est jamais envoyé. Les opérations qu’il contient sont gardées
              jusqu’à 30 jours après la clôture du mois, puis effacées. Tu peux les effacer toi-même à tout moment.
            </span>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              aria-label="Sélectionner un fichier CSV de banque"
              className="sr-only"
            />
          </label>
          <button
            type="button"
            onClick={showDemo}
            disabled={isLoadingMappings}
            className="mt-3 rounded-full border-[1.5px] border-bordure bg-surface/70 px-4 py-2 text-sm font-bold text-texte focus:outline-none focus:ring-2 focus:ring-focus disabled:opacity-55"
          >
            🧪 Essayer avec un exemple
          </button>
          {error && <p role="alert" className="mt-3 font-semibold text-depasse">{error}</p>}
        </div>

        <p role="status" className="sr-only">
          {transactions.length > 0
            ? `${isDemo ? 'Exemple chargé' : 'Fichier lu'} : ${transactions.length} opérations affichées ci-dessous.`
            : ''}
        </p>

        <div ref={resultsRef} className="scroll-mt-2">
          <CsvTransactionsTable transactions={transactions} isDemo={isDemo} onDemoSaved={() => setDemoSaved(true)} />
        </div>

        {transactions.length > 0 && (!isDemo || demoSaved) && (
          <p className="text-center text-sm text-texte-doux">
            Une fois les transactions enregistrées, passe à l’étape suivante.{' '}
            <Link href={ROUTES.reconciliation} className="font-black text-accent-fort underline underline-offset-4">
              Pointer les opérations →
            </Link>
          </p>
        )}
      </div>
    </ScreenCard>
  );
}
