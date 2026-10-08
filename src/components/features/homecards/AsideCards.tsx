"use client";

import React from 'react';
import styles from "@/app/(app)/tableau-de-bord/Dashboard.module.css";

export interface Transaction {
  id: string;
  title: string;
  amount: string;
  date: string;
  type: 'expense' | 'income';
}

interface BalanceCardProps {
  balance: string;
  encouragingMessage: string;
  balanceLabel?: string;
  reconcileEmptyText?: string;
  historyEmptyText?: string;
}

interface AsideCardsProps {
  reconcileItems: Transaction[];
  historyItems: Transaction[];
  onStartReconcile: () => void;
  onViewAllHistory: () => void;
}

export default function AsideCards({
  reconcileItems,
  historyItems,
  onStartReconcile,
  onViewAllHistory,
  balance,
  encouragingMessage,
  balanceLabel = 'Ton solde',
  reconcileEmptyText = 'Rien à rapprocher pour le moment.',
  historyEmptyText = 'Aucune transaction pour le moment.',
}: AsideCardsProps & BalanceCardProps) {
  return (
    <div className={styles.dashboardCards}>
      <aside aria-label="Opérations à rapprocher" className={`${styles.card} ${styles.cardReconcile}`}>
        <div className={styles.cardInner}>
          <div>
            <div className={styles.cardHeader}>
              <span aria-hidden="true" className="text-xl">✅</span>
              <h2 className={styles.cardTitle}>À rapprocher</h2>
            </div>

            <ul className={styles.cardList}>
              {reconcileItems.length === 0 && (
                <li className={styles.cardItem}>
                  <p className={styles.cardItemMeta}>{reconcileEmptyText}</p>
                </li>
              )}
              {reconcileItems.map((item) => (
                <li key={item.id} className={styles.cardItem}>
                  <div className={styles.cardItemText}>
                    <p className={styles.cardItemName}>{item.title}</p>
                    <p className={styles.cardItemMeta}>
                      <span className={styles.amountExpense}>{item.amount}</span> • {item.date}
                    </p>
                  </div>
                  <button type="button" aria-label={`Pointer l'opération ${item.title}`} className={styles.cardAction}>
                    -
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <button type="button" onClick={onStartReconcile} className={`${styles.cardButton} ${styles.cardButtonPrimary}`}>
            Commencer un rapprochement
          </button>
        </div>
      </aside>

      <aside aria-label="Solde actuel" className={`${styles.card} ${styles.cardBalance} ${styles.balancePanel}`}>
        <div className={styles.cardInner}>
          <div>
            <h2 className={styles.balanceHeader}>{balanceLabel}</h2>
            <p className={styles.balanceAmount}>{balance}</p>
            <p className={styles.balanceMessage}>{encouragingMessage}</p>
          </div>

          <div className={styles.balanceIllustration}>
            <span role="img" aria-label="Tirelire mignonne" className={styles.balanceEmoji}>
              🐷🪙
            </span>
            <div className={styles.balanceDot} aria-hidden="true" />
          </div>
        </div>
      </aside>

      <aside aria-label="Historique récent des transactions" className={`${styles.card} ${styles.cardHistory}`}>
        <div className={styles.cardInner}>
          <div>
            <div className={styles.cardHeader}>
              <span aria-hidden="true" className="text-xl">⏱️</span>
              <h2 className={`${styles.cardTitle} ${styles.cardHistoryTitle}`}>Historique</h2>
            </div>

            <ul className={styles.cardList}>
              {historyItems.length === 0 && (
                <li className={styles.cardItem}>
                  <p className={styles.cardItemMeta}>{historyEmptyText}</p>
                </li>
              )}
              {historyItems.map((item) => (
                <li key={item.id} className={`${styles.cardItem} ${styles.cardItemHistory}`}>
                  <div className={styles.cardItemText}>
                    <p className={styles.cardItemName}>{item.title}</p>
                    <p className={styles.cardItemMeta}>{item.date}</p>
                  </div>
                  <span className={item.type === 'income' ? styles.amountIncome : 'text-[#595959]'}>
                    {item.amount}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <button type="button" onClick={onViewAllHistory} className={`${styles.cardButton} ${styles.cardButtonSecondary}`}>
            Voir tout
          </button>
        </div>
      </aside>
    </div>
  );
}