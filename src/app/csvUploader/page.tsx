"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { TABLE_STYLES } from '@/constants/tableStyles';
import { SocieteGeneraleParser, BankTransaction, getSimplifiedMerchantName } from '@/services/csvParser';
import { LIBELLETRANSACT_CATEGORIES } from '@/constants/transactionLabel';

// Définition des couleurs de fond (surlignage) par ID de catégorie
const CATEGORY_BACKGROUNDS: Record<string, string> = {
  "1": "bg-[#e8d5cc]/80", // Assurance
  "2": "bg-[#d5e2e8]/80", // Phone
  "3": "bg-[#d5e8d6]/80", // Alimentation
  "4": "bg-[#e8d5d5]/80", // Santé
  "5": "bg-[#e8e5d5]/80", // Salaires
  "6": "bg-[#e2d5e8]/80", // Hobbies
  "7": "bg-[#e5d5e8]/80", // Ecommerce 
  "8": "bg-[#FFFACA]/80", // Bank
  "9": "bg-[#d5e8e5]/80", // Transport
  "10": "bg-[#dda0dd]/80", // Tabac
};

/**
 * Récupère le libellé textuel de la catégorie à partir de son ID
 */
function getCategoryLabel(categoryId: string | null): string {
  if (!categoryId) return "Non catégorisé";
  const cat = LIBELLETRANSACT_CATEGORIES.find((c) => c.key === categoryId);

  return cat ? cat.label : "Autre";
}

type CategoryGroup = {
  categoryLabel: string;
  categoryId: string | null;
  totalAmount: number;
  records: BankTransaction[];
};

function groupTransactionsByCategory(transactions: BankTransaction[]): CategoryGroup[] {
  const groups = transactions.reduce<Record<string, CategoryGroup>>((acc, tx) => {
    const categoryLabel = getCategoryLabel(tx.categoryId);

    if (!acc[categoryLabel]) {
      acc[categoryLabel] = {
        categoryLabel,
        categoryId: tx.categoryId,
        totalAmount: 0,
        records: [],
      };
    }

    acc[categoryLabel].totalAmount += tx.amount;
    acc[categoryLabel].records.push(tx);

    return acc;
  }, {});

  return Object.values(groups);
}

export default function CsvUploaderPage() {
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups((previous) => ({
      ...previous,
      [groupKey]: !previous[groupKey],
    }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError(null);

    const reader = new FileReader();
    reader.readAsText(file, 'windows-1252');

    reader.onload = (fileEvent: ProgressEvent<FileReader>) => {
      try {
        const text = fileEvent.target?.result as string;
        if (!text) {
          setError("Impossible de lire le contenu du fichier.");
          return;
        }

        const parser = new SocieteGeneraleParser(text);
        const parsed = parser.parse();

        if (parsed.length === 0) {
          setError("Aucune transaction valide n'a pu être lue dans ce fichier.");
          return;
        }

        setTransactions(parsed);
      } catch (err: unknown) {
        console.error(err);
        setError("Erreur lors de la lecture du fichier CSV.");
      }
    };
  };

  const groupedTransactions = groupTransactionsByCategory(transactions);

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
              {fileName ? `Fichier sélectionné : ${fileName}` : "Glisse ton fichier CSV ici ou clique pour parcourir"}
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

        {/* Tableau des transactions importées avec surlignage et gestion des virements */}
        {transactions.length > 0 && (
          <div className="rounded-[2rem] border-[3px] border-[#d7b59d] border-dashed bg-[#f5eadf] p-3 sm:p-4 shadow-[0_3px_0_rgba(140,103,86,0.12)] space-y-4">
            <h2 className="px-2 text-[1.4rem] font-black text-[#5d4d44]">
              Transactions lues ({transactions.length})
            </h2>
            <div>
            </div>
            <div className="overflow-x-auto rounded-xl border border-[#d8b7a5]/50 shadow-inner max-w-full">

              <table className="w-full min-w-0 border-collapse text-left" aria-label="Synthèse par catégorie des transactions importées du CSV">
                <thead>
                  <tr className="bg-[#f0d8c8] text-[#5a473d]">
                    <th scope="col" className={TABLE_STYLES.thCategory}>Groupe / Catégorie</th>
                    <th scope="col" className={TABLE_STYLES.thCategory}>Nb items</th>
                    <th scope="col" className={TABLE_STYLES.thAmount}>Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedTransactions.map((group) => {
                    const rowHighlightClass = group.categoryId && CATEGORY_BACKGROUNDS[group.categoryId]
                      ? CATEGORY_BACKGROUNDS[group.categoryId]
                      : 'bg-white/40';
                    const isExpanded = !!expandedGroups[group.categoryLabel];

                    return (
                      <React.Fragment key={group.categoryLabel}>
                        <tr className={`border-b border-[#d8b7a5]/30 transition-colors ${rowHighlightClass}`}>
                          <td className={TABLE_STYLES.cellCategory}>
                            <button
                              type="button"
                              onClick={() => toggleGroup(group.categoryLabel)}
                              aria-expanded={isExpanded}
                              className="flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1 text-left text-xs font-bold text-[#5d4d44] transition hover:bg-white/40"
                            >
                              {group.categoryId ? (
                                <span className="px-2.5 py-1 rounded-full bg-white/75 shadow-sm border border-[#d8b7a5]">
                                  {group.categoryLabel}
                                </span>
                              ) : (
                                <span className="italic text-gray-400">Non catégorisé</span>
                              )}
                              <span className="text-[11px] font-black text-[#6a534c]">{isExpanded ? '▾' : '▸'}</span>
                            </button>
                          </td>
                          <td className={TABLE_STYLES.cellCategory}>{group.records.length}</td>
                          <td className={`${TABLE_STYLES.cellAmount} ${group.totalAmount < 0 ? 'text-[#b94a48]' : 'text-[#3c763d]'}`}>
                            {group.totalAmount.toFixed(2)} €
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr>
                            <td colSpan={3} className="bg-[#f9f1ea] p-3">
                              <div className="overflow-hidden rounded-xl border border-[#d8b7a5]/60 bg-white/40">
                                <table className="w-full min-w-0 border-collapse text-left text-[11px] sm:text-sm">
                                  <thead>
                                    <tr className="bg-[#efe0d6] text-[#5d4d44]">
                                      <th className="px-2 py-2 font-bold sm:px-3">Date</th>
                                      <th className="px-2 py-2 font-bold sm:px-3">Libellé</th>
                                      <th className="px-2 py-2 font-bold text-right sm:px-3">Montant</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {group.records.map((tx) => (
                                      <tr key={tx.id} className="border-t border-[#d8b7a5]/40 align-top">
                                        <td className="px-2 py-2 text-[#5d4d44] sm:px-3">{tx.date}</td>
                                        <td className="max-w-[160px] px-2 py-2 text-[#5d4d44] break-words sm:px-3">{getSimplifiedMerchantName(tx.detail)}</td>
                                        <td className={`px-2 py-2 text-right font-semibold sm:px-3 ${tx.amount < 0 ? 'text-[#b94a48]' : 'text-[#3c763d]'}`}>
                                          {tx.amount.toFixed(2)} €
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
        
            </div>

            {/* Bouton de validation finale */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => alert("Résultat prêt à être injecté en BDD !")}
                className="rounded-[1.5rem] border-[3px] border-[#82b89f] bg-[#8cd3b3] px-6 py-3 font-black text-[#2e4d3d] shadow-[0_4px_0_rgba(92,143,115,0.85)] transition-transform hover:translate-y-[2px] focus:outline-none focus:ring-2 focus:ring-[#2e4d3d]"
              >
                Enregistrer le résultat validé
              </button>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}