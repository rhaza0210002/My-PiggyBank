"use client";

import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import Link from 'next/link';
import ColumnMappingSteps from '@/components/features/import/ColumnMappingSteps';
import CsvTransactionsTable from '@/components/features/tables/CsvTransactionsTable';
import ScreenCard from '@/components/ui/ScreenCard';
import { ROUTES } from '@/constants/routes';
import { categorizeLines, type BankTransaction } from '@/services/csvParser';
import { formatSignature, recallMapping, rememberMapping } from '@/services/importFormatMemory';
import { applyMapping } from '@/utils/statementImport/applyMapping';
import { decodeStatement } from '@/utils/statementImport/decodeStatement';
import { EMPTY_FILE_MESSAGE, NO_OPERATIONS_MESSAGE, readStatement } from '@/utils/statementImport/readStatement';
import type { ColumnMapping, CsvTable, Doubt, StatementLine } from '@/utils/statementImport/types';
import { scrollIntoZone } from '@/utils/scroll';
import { endDemo, isDemoActive } from '@/services/demoStore';
import { buildDemoTransactions, shouldConfirmReplaceDemo } from '@/utils/demoStatement';
import { getLibelleTransacts, type LibelleTransact } from '@/services/transactionCategoryService';
import Icon from '@/components/ui/Icon';

/** Fichier lu avec un doute : on attend les réponses de la personne avant d'afficher les opérations. */
interface PendingMapping {
  table: CsvTable;
  mapping: ColumnMapping;
  doubts: Doubt[];
  replacesDemo: boolean;
}

/** Sans règles lisibles, les opérations s'affichent simplement non catégorisées (comme dans l'exemple). */
async function loadLabels(): Promise<LibelleTransact[]> {
  try {
    return await getLibelleTransacts();
  } catch {
    return [];
  }
}

export default function CsvUploaderPage() {
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingMappings, setIsLoadingMappings] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [demoSaved, setDemoSaved] = useState(false);
  const [pending, setPending] = useState<PendingMapping | null>(null);
  const [remembered, setRemembered] = useState<{ table: CsvTable; mapping: ColumnMapping } | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Sur un petit écran le résultat arrive sous la zone de dépôt, hors de vue : on y amène la personne.
  useEffect(() => {
    if (transactions.length === 0 && !pending) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (resultsRef.current) scrollIntoZone(resultsRef.current, reduced ? 'auto' : 'smooth');
  }, [transactions, pending]);

  const showLines = async (lines: StatementLine[], replacesDemo: boolean) => {
    if (lines.length === 0) {
      setError(NO_OPERATIONS_MESSAGE);
      return;
    }
    const labels = await loadLabels();
    // L'exemple n'est effacé qu'une fois le vrai fichier lu : un fichier illisible le laisse intact.
    if (replacesDemo) endDemo();
    setTransactions(categorizeLines(lines, labels));
  };

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const replacesDemo = shouldConfirmReplaceDemo(isDemoActive(), false);
    if (replacesDemo && !window.confirm('Ton exemple sera effacé. Continuer ?')) {
      event.target.value = '';
      return;
    }

    setDemoSaved(false);
    setFileName(file.name);
    setIsDemo(false);
    setError(null);
    setTransactions([]);
    setPending(null);
    setRemembered(null);
    setIsLoadingMappings(true);

    try {
      const text = decodeStatement(await file.arrayBuffer());
      const first = readStatement(text);
      if (first.kind === 'error') {
        setError(first.message);
        return;
      }
      if (first.kind === 'ofx') {
        await showLines(first.lines, replacesDemo);
        return;
      }

      const signature = formatSignature(first.table);
      const recalled = recallMapping(signature);
      const result = recalled ? readStatement(text, recalled) : first;
      if (result.kind !== 'csv') return;

      if (result.doubts.length > 0) {
        setPending({ table: result.table, mapping: result.mapping, doubts: result.doubts, replacesDemo });
        return;
      }
      if (result.fromMemory) {
        rememberMapping(signature, result.mapping);
        setRemembered({ table: result.table, mapping: result.mapping });
      }
      await showLines(result.lines, replacesDemo);
    } catch (err: unknown) {
      console.error(err);
      setError(EMPTY_FILE_MESSAGE);
    } finally {
      setIsLoadingMappings(false);
      event.target.value = '';
    }
  };

  const confirmMapping = async (mapping: ColumnMapping) => {
    if (!pending) return;
    rememberMapping(formatSignature(pending.table), mapping);
    const { lines } = applyMapping(pending.table, mapping);
    const { replacesDemo } = pending;
    setPending(null);
    await showLines(lines, replacesDemo);
  };

  const redoQuestions = () => {
    if (!remembered) return;
    setTransactions([]);
    setPending({ ...remembered, doubts: ['illisibles'], replacesDemo: false });
    setRemembered(null);
  };

  const showDemo = async () => {
    setDemoSaved(false);
    setError(null);
    setFileName(null);
    setPending(null);
    setRemembered(null);
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
      title="Importer ton relevé" icon="import"
      subtitle="Dépose le CSV de ta banque : on range les opérations pour toi, tu vérifies, c’est tout."
    >
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="rounded-carte border-2 border-dashed border-bordure bg-surface-douce p-4 text-center sm:p-6">
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl p-2 focus-within:ring-2 focus-within:ring-focus">
            <span className="rotate-[-6deg] rounded-full border-2 border-texte bg-accent p-3 text-texte shadow-sticker-petit">
              <Icon name="folder" className="size-7" />
            </span>
            <span className="text-lg font-bold text-texte">
              {isLoadingMappings
                ? 'Lecture du relevé…'
                : fileName
                  ? `Fichier : ${fileName}`
                  : 'Choisir mon relevé (CSV ou OFX)'}
            </span>
            <span className="text-sm italic text-texte-doux">
              Ton fichier est lu sur ton appareil et n’est jamais envoyé. Les opérations qu’il contient sont gardées
              jusqu’à 30 jours après la clôture du mois, puis effacées. Tu peux les effacer toi-même à tout moment.
            </span>
            <input
              type="file"
              accept=".csv,.ofx,.qfx,.txt"
              onChange={handleFileUpload}
              aria-label="Sélectionner le relevé de ta banque (CSV ou OFX)"
              className="sr-only"
            />
          </label>
          <button
            type="button"
            onClick={showDemo}
            disabled={isLoadingMappings}
            className="mt-3 rounded-full border-[1.5px] border-bordure bg-surface/70 px-4 py-2 text-sm font-bold text-texte focus:outline-none focus:ring-2 focus:ring-focus disabled:opacity-55"
          >
            <Icon name="flask" className="mr-1 inline size-4 align-[-2px]" />Essayer avec un exemple
          </button>
          {error && <p role="alert" className="mt-3 font-semibold text-depasse">{error}</p>}
        </div>

        <p role="status" className="sr-only">
          {transactions.length > 0
            ? `${isDemo ? 'Exemple chargé' : 'Fichier lu'} : ${transactions.length} opérations affichées ci-dessous.`
            : ''}
        </p>

        <div ref={resultsRef} className="scroll-mt-2 space-y-3">
          {pending && (
            <ColumnMappingSteps
              key={`${fileName}-${pending.doubts.join()}`}
              table={pending.table}
              initialMapping={pending.mapping}
              doubts={pending.doubts}
              onConfirm={confirmMapping}
            />
          )}
          {remembered && transactions.length > 0 && (
            <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-xl bg-accent-doux px-4 py-2 text-center text-sm font-semibold text-texte">
              Même format que la dernière fois, tes réglages ont été repris.
              <button
                type="button"
                onClick={redoQuestions}
                className="font-black text-accent-fort underline underline-offset-4 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus"
              >
                Refaire les questions
              </button>
            </p>
          )}
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