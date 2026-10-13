/** Une opération lue dans le relevé, avant catégorisation. La date est toujours en jj/mm/aaaa. */
export interface StatementLine {
  date: string;
  label: string;
  detail: string;
  amount: number;
}

/** Le tableau d'un CSV, une fois les lignes d'en-tête de la banque écartées. */
export interface CsvTable {
  separator: string;
  headers: string[];
  hasHeader: boolean;
  rows: string[][];
}

export type AmountColumns =
  | { kind: 'single'; column: number | null }
  | { kind: 'split'; debit: number | null; credit: number | null };

/** Quelle colonne joue quel rôle, et comment lire les nombres et les dates du fichier. */
export interface ColumnMapping {
  date: number | null;
  label: number | null;
  detail: number | null;
  amount: AmountColumns;
  decimal: ',' | '.';
  dateOrder: 'dmy' | 'mdy';
}

/** Ce dont la lecture automatique n'est pas sûre : chaque doute amène une question. */
export type Doubt = 'date' | 'montant' | 'libelle' | 'ordreDate' | 'illisibles';

export type ReadResult =
  | { kind: 'ofx'; lines: StatementLine[] }
  | {
      kind: 'csv';
      table: CsvTable;
      mapping: ColumnMapping;
      doubts: Doubt[];
      lines: StatementLine[];
      fromMemory: boolean;
    }
  | { kind: 'error'; message: string };
