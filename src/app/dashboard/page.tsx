"use client";

import AsideCards, { Transaction } from "@/components/features/homecards/AsideCards";
import styles from "@/app/dashboard/Dashboard.module.css";

export default function DashboardPage() {
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
  const user = localStorage.getItem('piggy_current_user');
  const isAuthen = user ? JSON.parse(user) : console.log("Aucun utilisateur trouvé dans le localStorage");

  return (
    <section className="mt-5 mx-5 ${styles.dashboardPage}">
        {isAuthen && (
          <h1 className="text-[2.2rem] font-black tracking-[-0.05em] text-[#5d4d44] mb-6 font-sans">
            Bienvenue <span className="text-[#a36351]">{isAuthen.pseudo}</span> !
          </h1>
        )}
        {/* Le reste de ton code... */}
      <div className={styles.dashboardInner}>
        <div className="rounded-3xl border border-[#e5c4b4] bg-[#fff8f2] p-4 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#c86445]">
            Vue d’ensemble
          </p>
          <h1 className="mt-2 text-2xl font-bold text-[#5a4d41]">
            Ta tirelire est en bonne forme.
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

