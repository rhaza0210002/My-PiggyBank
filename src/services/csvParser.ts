import { LIBELLETRANSACT } from "@/constants/transactionLabel";
import {
  getCsvColumnIndex,
  getCsvSeparator,
  isCsvAmountCell,
  isCsvDateCell,
  normalizeCsvCell,
  parseCsvAmount,
} from "@/utils/csvParsing";

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
  label: string; // Libellé brut de la ligne
  detail: string; // Détails de l'écriture (pour boucler sur tes constantes)
  amount: number;
  categoryId: string | null; // ID de catégorie déduit automatiquement si match
  type: "VIREMENT_ENTRANT" | "VIREMENT_SORTANT" | "AUTRE"; // Type de transaction détecté
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

  constructor(csvText: string) {
    this.csvText = csvText;
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
   * pour permettre le bouclage direct sur les constantes.
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

        const matchedConstant = LIBELLETRANSACT.find((item) =>
          detail.toLowerCase().includes(item.label.toLowerCase()),
        );
        const simplifiedLabel = matchedConstant?.label ?? detail;
        const category = matchedConstant?.key ?? "";
        const lowerDetail = [category, simplifiedLabel]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return {
          id: `tx-${index}`,
          date,
          label: matchedConstant?.label ?? "",
          detail: lowerDetail,
          amount,
          categoryId: matchedConstant ? matchedConstant.id_cat : null,
          type: transactionType,
        } satisfies BankTransaction;
      })
      .filter(
        (transaction): transaction is BankTransaction => transaction !== null,
      );
  }
}

/**
 * Simplifie le libellé brut de la banque pour n'afficher que le nom propre de l'entreprise s'il est reconnu.
 */
export function getSimplifiedMerchantName(detail: string): string {
  const found = LIBELLETRANSACT.find((item) =>
    detail.toLowerCase().includes(item.label.toLowerCase()),
  );
  if (found) {
    return (
      found.label.charAt(0).toUpperCase() + found.label.slice(1).toLowerCase()
    );
  }

  return detail;
}

export default SocieteGeneraleParser;
