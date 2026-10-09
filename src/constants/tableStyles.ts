// src/constants/tableStyles.ts

export const MONTHS = [
  { label: "Janvier", key: "janvier" },
  { label: "Février", key: "fevrier" },
  { label: "Mars", key: "mars" },
  { label: "Avril", key: "avril" },
  { label: "Mai", key: "mai" },
  { label: "Juin", key: "juin" },
  { label: "Juillet", key: "juillet" },
  { label: "Août", key: "aout" },
  { label: "Septembre", key: "septembre" },
  { label: "Octobre", key: "octobre" },
  { label: "Novembre", key: "novembre" },
  { label: "Décembre", key: "decembre" },
] as const;

/** Abréviations courtes pour les petits espaces (même ordre que MONTHS). */
export const MONTH_SHORT_LABELS = ["Janv.", "Févr.", "Mars", "Avr.", "Mai", "Juin", "Juil.", "Août", "Sept.", "Oct.", "Nov.", "Déc."] as const;

/** Tableaux aérés : couleurs du thème, montants à droite en chiffres de largeur égale pour que les colonnes tombent juste. */
export const TABLE_STYLES = {
  rowEven: "bg-surface",
  rowOdd: "bg-surface-douce/60",
  cellCategory:
    "border-t border-bordure px-3 py-2.5 text-[0.95rem] font-semibold text-texte break-words",
  cellAmount:
    "border-t border-bordure px-3 py-2.5 text-right text-[0.95rem] font-semibold tabular-nums text-texte whitespace-nowrap",
  thCategory:
    "px-3 py-2.5 text-left text-[0.95rem] font-bold",
  thAmount:
    "px-3 py-2.5 text-right text-[0.95rem] font-bold tabular-nums whitespace-nowrap",
} as const;