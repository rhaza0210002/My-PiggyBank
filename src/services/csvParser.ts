import {
  getCsvColumnIndex,
  getCsvSeparator,
  isCsvAmountCell,
  isCsvDateCell,
  normalizeCsvCell,
  parseCsvAmount,
} from "@/utils/csvParsing";
import type { LibelleTransact } from "@/services/transactionCategoryService";

export interface RawRowData {
  id: string;
  columns: string[];
}

export interface ParseResult {
  headers: string[];
  rows: RawRowData[];
}

export interface BankTransaction {
  id: string;
  date: string;
  label: string;
  detail: string;
  rawDetail: string;
  amount: number;
  categoryId: string | null;
  categoryLabel: string | null;
  categoryKey: string | null;
  type: "VIREMENT_ENTRANT" | "VIREMENT_SORTANT" | "AUTRE";
}

export interface ColumnObservation {
  index: number;
  header: string;
  values: string[];
}

export interface ColumnMapResult {
  headers: string[];
  rows: RawRowData[];
  columns: Record<string, ColumnObservation>;
}

export class SocieteGeneraleParser {
  private csvText: string;
  private transactionLabels: LibelleTransact[];

  constructor(
    csvText: string,
    transactionLabels: LibelleTransact[] = [],
  ) {
    this.csvText = csvText;
    this.transactionLabels = transactionLabels;
  }

  private inferTransactionIndexes(rows: RawRowData[]) {
    for (const row of rows) {
      const dateIndex = row.columns.findIndex((value) =>
        isCsvDateCell(value),
      );
      const amountIndex = row.columns.findIndex((value) =>
        isCsvAmountCell(value),
      );

      if (dateIndex === -1 || amountIndex === -1) continue;

      const labelIndex = row.columns.findIndex(
        (value, index) =>
          index !== dateIndex &&
          index !== amountIndex &&
          value.trim().length > 0 &&
          !isCsvDateCell(value) &&
          !isCsvAmountCell(value),
      );

      if (labelIndex !== -1) {
        return { dateIndex, labelIndex, amountIndex };
      }
    }

    return null;
  }

  private normalizeMatchText(value: string): string {
    return value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
  }

  public parseAllColumns(): ParseResult {
    const cleanedLines = this.csvText
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line !== "");

    if (cleanedLines.length === 0) {
      return { headers: [], rows: [] };
    }

    const headerIndex = cleanedLines.findIndex((line) => {
      const normalized = line
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9;]/g, "");

      return (
        normalized.includes("date") &&
        (normalized.includes("libelle") ||
          normalized.includes("label") ||
          normalized.includes("description") ||
          normalized.includes("detail")) &&
        (normalized.includes("montant") || normalized.includes("amount"))
      );
    });

    const tableLines =
      headerIndex === -1 ? cleanedLines : cleanedLines.slice(headerIndex);

    if (tableLines.length === 0) {
      return { headers: [], rows: [] };
    }

    const separator = getCsvSeparator(tableLines[0]);

    const headers = tableLines[0]
      .split(separator)
      .map(normalizeCsvCell);

    const rows: RawRowData[] = tableLines.slice(1).map((line, index) => {
      const columns = line
        .split(separator)
        .map(normalizeCsvCell);

      return {
        id: `row-index-${index}`,
        columns,
      };
    });

    return { headers, rows };
  }

  public getColumnMap(): ColumnMapResult {
    const { headers, rows } = this.parseAllColumns();

    const columns: Record<string, ColumnObservation> = {};

    headers.forEach((header, index) => {
      const values = rows.map((row) => row.columns[index] ?? "");
      columns[header] = {
        index,
        header,
        values,
      };
    });

    return {
      headers,
      rows,
      columns,
    };
  }

  /**
   * Analyse et associe chaque ligne avec le détail de l'écriture
  * en utilisant les correspondances de libelle_transacts chargées depuis la base.
   */
  public parse(): BankTransaction[] {
    const { headers, rows } = this.parseAllColumns();

    if (headers.length === 0 || rows.length === 0) {
      return [];
    }

    let dateIndex = getCsvColumnIndex(headers, [
      "date",
      "dateoperation",
      "dateoperationbancaire",
    ]);

    const detailIndex = getCsvColumnIndex(headers, [
      "detailecriture",
      "detaildecriture",
      "detaildelcriture",
      "detail",
      "libelledetaille",
      "libellédétaillé",
    ]);

    let labelIndex = getCsvColumnIndex(headers, [
      "libelle",
      "libellé",
      "description",
      "label",
      "designation",
      "operation",
      "transaction",
    ]);

    let amountIndex = getCsvColumnIndex(headers, [
      "montant",
      "amount",
      "debit",
      "credit",
      "solde",
      "montants",
    ]);

    const inferredIndexes = this.inferTransactionIndexes(rows);

    if (
      dateIndex === -1 ||
      (labelIndex === -1 && detailIndex === -1) ||
      amountIndex === -1
    ) {
      if (inferredIndexes) {
        dateIndex = inferredIndexes.dateIndex;
        labelIndex = inferredIndexes.labelIndex;
        amountIndex = inferredIndexes.amountIndex;
      } else {
        return [];
      }
    }

    const targetTextIndex = detailIndex !== -1 ? detailIndex : labelIndex;

    return rows
      .map((row, index): BankTransaction | null => {
        const date = row.columns[dateIndex] ?? "";
        const detail = row.columns[targetTextIndex] ?? "";
        const amountValue = row.columns[amountIndex] ?? "";
        const amount = parseCsvAmount(amountValue);

        if (!date || !detail || amount === null) {
          return null;
        }

        // Détection automatique du type de virement
        const upperDetail = detail.toUpperCase();
        let transactionType: "VIREMENT_ENTRANT" | "VIREMENT_SORTANT" | "AUTRE" =
          "AUTRE";

        if (upperDetail.includes("VIR") || upperDetail.includes("VIREMENT")) {
          transactionType =
            amount > 0 ? "VIREMENT_ENTRANT" : "VIREMENT_SORTANT";
        }

        const normalizedCsvLine = this.normalizeMatchText(row.columns.join(' '));
        const matchedLabel = this.transactionLabels.find((item) => {
          const normalizedLabel = this.normalizeMatchText(item.label);
          return normalizedLabel.length > 0 && normalizedCsvLine.includes(normalizedLabel);
        });
        const categoryKey = matchedLabel?.key ?? '';
        const simplifiedLabel = matchedLabel?.label ?? detail;
        const normalizedDetail = [categoryKey, simplifiedLabel]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return {
          id: `tx-${index}`,
          date,
          label: matchedLabel?.label ?? '',
          detail: normalizedDetail,
          rawDetail: detail,
          amount,
          categoryId: matchedLabel?.id_cat ?? null,
          categoryLabel: matchedLabel?.key ?? null,
          categoryKey: matchedLabel?.key ?? null,
          type: transactionType,
        } satisfies BankTransaction;
      })
      .filter(
        (transaction): transaction is BankTransaction => transaction !== null,
      );
  }
}

export default SocieteGeneraleParser;
