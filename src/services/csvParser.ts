import type { LibelleTransact } from "@/services/transactionCategoryService";
import { normalizeMatchText } from "@/utils/labelMatching";
import type { StatementLine } from "@/utils/statementImport/types";

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

function transferType(text: string, amount: number): BankTransaction["type"] {
  const upper = text.toUpperCase();
  if (!upper.includes("VIR")) return "AUTRE";
  return amount > 0 ? "VIREMENT_ENTRANT" : "VIREMENT_SORTANT";
}

/**
 * Associe chaque opération lue dans le relevé à une catégorie, grâce aux règles de libelle_transacts.
 * Le texte brut (détail, sinon libellé) sert aux doublons : il reste celui qu'utilisait l'ancien lecteur
 * Société Générale (« Détail de l'écriture »), pour que les relevés déjà importés gardent les mêmes clés.
 */
export function categorizeLines(lines: StatementLine[], transactionLabels: LibelleTransact[]): BankTransaction[] {
  const rules = transactionLabels
    .map((rule) => ({ rule, normalized: normalizeMatchText(rule.label) }))
    .filter(({ normalized }) => normalized.length > 0);

  return lines.map((line, index) => {
    const rawDetail = line.detail || line.label;
    const searchable = normalizeMatchText([line.date, line.label, line.detail].join(" "));
    const matched = rules.find(({ normalized }) => searchable.includes(normalized))?.rule;
    const categoryKey = matched?.key ?? "";
    const simplifiedLabel = matched?.label ?? rawDetail;

    return {
      id: `tx-${index}`,
      date: line.date,
      label: matched?.label ?? "",
      detail: [categoryKey, simplifiedLabel].filter(Boolean).join(" ").toLowerCase(),
      rawDetail,
      amount: line.amount,
      categoryId: matched?.id_cat ?? null,
      categoryLabel: matched?.key ?? null,
      categoryKey: matched?.key ?? null,
      type: transferType(rawDetail, line.amount),
    };
  });
}
