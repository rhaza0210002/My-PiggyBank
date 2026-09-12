"use client";
import React, { useState, useEffect } from 'react';
import AsideCards, { Transaction } from "@/components/features/homecards/AsideCards";
import styles from "@/app/dashboard/Dashboard.module.css";
import { supabase } from '@/lib/supabaseClient';
import { getUserProfile } from '@/services/userService';

export default function DashboardPage() {
  const [userName, setUserName] = useState<string>("Mallaury");

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

  const reconcileItems: Transaction[] = [
    {
      id: "1",
      title: "Supermarché",
      amount: "-25,00 €",
      date: "18 avril",
      type: "expense",
    },
    {
      id: "2",
      title: "Abonnement Musique",
      amount: "-9,99 €",
      date: "15 avril",
      type: "expense",
    },
  ];

  const historyItems: Transaction[] = [
    {
      id: "1",
      title: "Salaire",
      amount: "+1 500,00 €",
      date: "02 avril",
      type: "income",
    },
    {
      id: "2",
      title: "Facture Internet",
      amount: "-40,00 €",
      date: "28 mars",
      type: "expense",
    },
  ];

  const handleStartReconcile = () => {
    console.log("Lancement du rapprochement bancaire");
  };

  const handleViewAllHistory = () => {
    console.log("Affichage de l'historique complet");
  };

  return (
    <section className="mt-5 mx-5 ${styles.dashboardPage}">
      <div className={styles.dashboardInner}>
        <div className="rounded-3xl border border-[#e5c4b4] bg-[#fff8f2] p-4 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#c86445]">
            Bienvenue sur My PiggyBank {userName}
          </p>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#c86445]">
            Vue d’ensemble
          </p>
          <h1 className="mt-2 text-2xl font-bold text-[#5a4d41]">
            Ta tirelire est en bonne forme, .
          </h1>
          <p className="mt-2 text-sm text-[#7b655a]">
            Gère tes rapprochements, suis ton solde et garde un œil sur tes dernières opérations.
          </p>
        </div>

        <AsideCards
          reconcileItems={reconcileItems}
          historyItems={historyItems}
          onStartReconcile={handleStartReconcile}
          onViewAllHistory={handleViewAllHistory}
          balance="1 234,56 €"
          encouragingMessage="Tu tiens la bonne voie !"
        />
      </div>
    </section>
  );
}