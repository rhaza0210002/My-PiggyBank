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

export const TABLE_STYLES = {
  rowEven: "bg-[#f7e8df]",
  rowOdd: "bg-[#e5f0d9]",
  cellCategory:
    "border-r border-[#d8b7a5] border-t border-[#d8b7a5] px-4 py-3 text-[1rem] sm:text-[1.1rem] font-semibold text-[#54433d] break-words",
  cellAmount:
    "border-t border-[#d8b7a5] px-4 py-3 text-center text-[1rem] sm:text-[1.1rem] font-semibold text-[#4a3d37] whitespace-nowrap",
  thCategory:
    "border-r border-[#d8b7a5] px-4 py-3 text-left text-[1rem] sm:text-[1.1rem] font-bold",
  thAmount:
    "px-4 py-3 text-center text-[1rem] sm:text-[1.1rem] font-bold whitespace-nowrap",
} as const;
