"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AsideCards, { Transaction } from "@/components/features/homecards/AsideCards";
import styles from "@/app/dashboard/Dashboard.module.css";
import { supabase } from '@/lib/supabaseClient';
import { getUserProfile } from '@/services/userService';
import {
  getMonthTotals,
  getRecentTransactions,
  getUncategorizedTransactions,
  type MonthTotals,
  type StoredTransaction,
} from '@/services/transactionService';

const euroFormatter = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
const signedEuroFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  signDisplay: 'exceptZero',
});

function toCardItem(transaction: StoredTransaction): Transaction {
  const amount = Number(transaction.amount);
  return {
    id: transaction.id,
    title: transaction.label,
    amount: signedEuroFormatter.format(amount),
    date: new Date(`${transaction.booked_on}T00:00:00`).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
    }),
    type: amount >= 0 ? 'income' : 'expense',
  };
}

function getEncouragingMessage(totals: MonthTotals | null, hasError: boolean): string {
  if (hasError) return "Impossible de charger tes données.";
  if (!totals || totals.count === 0) return "Importe un relevé CSV pour commencer.";
  if (totals.net >= 0) return "Tu tiens la bonne voie !";
  return "Ce mois-ci, tes dépenses dépassent tes revenus.";
}

export default function DashboardPage() {
  const router = useRouter();
  const [userName, setUserName] = useState<string>("");
  const [reconcileItems, setReconcileItems] = useState<Transaction[]>([]);
  const [historyItems, setHistoryItems] = useState<Transaction[]>([]);
  const [monthTotals, setMonthTotals] = useState<MonthTotals | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUserData() {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;

      if (user) {
        try {
          const profile = await getUserProfile(user.id);
          if (profile?.pseudo) {
            setUserName(profile.pseudo);
          } else if (profile?.pseudo === null && user.email) {
            setUserName(profile.pseudo || user.email.split('@')[0]);
          } else if (user.email) {
            setUserName(user.email.split('@')[0]);
          }
        } catch (error) {
          console.error("Erreur lors de la récupération du profil :", error);
          if (user.email) {
            setUserName(user.email.split('@')[0]);
          }
        }
      }
    }

    fetchUserData();
  }, []);

  useEffect(() => {
    let isMounted = true;
    const now = new Date();

    Promise.all([
      getUncategorizedTransactions(3),
      getRecentTransactions(5),
      getMonthTotals(now.getFullYear(), now.getMonth()),
    ])
      .then(([toReconcile, recent, totals]) => {
        if (!isMounted) return;
        setReconcileItems(toReconcile.map(toCardItem));
        setHistoryItems(recent.map(toCardItem));
        setMonthTotals(totals);
        setDataError(null);
      })
      .catch((error: unknown) => {
        if (!isMounted) return;
        console.error("Erreur lors du chargement du dashboard :", error);
        setDataError(error instanceof Error ? error.message : "Chargement impossible.");
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleStartReconcile = () => {
    router.push('/csvUploader');
  };

  const handleViewAllHistory = () => {
    console.log("Affichage de l'historique complet");
  };

  const balance = monthTotals && monthTotals.count > 0 ? euroFormatter.format(monthTotals.net) : '—';

  return (
    <section className={`mt-5 mx-5 ${styles.dashboardPage}`}>
      <div className={styles.dashboardInner}>
        <div className="rounded-3xl border border-[#e5c4b4] bg-[#fff8f2] p-4 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#c86445]">
            Bienvenue sur My PiggyBank {userName}
          </p>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#c86445]">
            Vue d’ensemble
          </p>
          <h1 className="mt-2 text-2xl font-bold text-[#5a4d41]">
            Ta tirelire est en bonne forme{userName ? `, ${userName}` : ''}.
          </h1>
          <p className="mt-2 text-sm text-[#7b655a]">
            Gère tes rapprochements, suis ton solde et garde un œil sur tes dernières opérations.
          </p>
          {dataError && (
            <p role="alert" className="mt-3 rounded-lg border border-red-300 bg-red-50 p-3 text-sm font-semibold text-red-800">
              {dataError}
            </p>
          )}
        </div>

        <AsideCards
          reconcileItems={reconcileItems}
          historyItems={historyItems}
          onStartReconcile={handleStartReconcile}
          onViewAllHistory={handleViewAllHistory}
          balance={balance}
          balanceLabel="Solde du mois"
          encouragingMessage={getEncouragingMessage(monthTotals, dataError !== null)}
          reconcileEmptyText="Aucune opération sans catégorie."
        />
      </div>
    </section>
  );
}
