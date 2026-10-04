export function normalizeCsvCell(value: string): string {
  return value.trim().replace(/^"|"$/g, "").replace(/""/g, '"');
}

export function getCsvSeparator(line: string): string {
  if (line.includes(";")) return ";";
  if (line.includes(",")) return ",";
  return "\t";
}

function normalizeHeader(value: string): string {
  return normalizeCsvCell(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

export function getCsvColumnIndex(headers: string[], candidates: string[]): number {
  const normalizedCandidates = candidates.map(normalizeHeader);

  return headers.findIndex((header) => {
    const normalizedHeader = normalizeHeader(header);
    return normalizedCandidates.some((candidate) =>
      normalizedHeader.includes(candidate),
    );
  });
}

export function isCsvDateCell(value: string): boolean {
  const normalized = normalizeCsvCell(value);
  return (
    /^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}$/.test(normalized) ||
    /^\d{4}-\d{2}-\d{2}$/.test(normalized)
  );
}

function normalizeAmount(value: string): string {
  return normalizeCsvCell(value)
    .replace(/€|\s/g, "")
    .replace(/\u00a0/g, "")
    .replace(/^\((.*)\)$/, "-$1");
}

export function isCsvAmountCell(value: string): boolean {
  const normalized = normalizeAmount(value);
  return (
    /^[-+]?\d{1,3}(?:[\s.]\d{3})*(?:,\d+)?$/.test(normalized) ||
    /^[-+]?\d+(?:,\d+)?$/.test(normalized)
  );
}

export function parseCsvAmount(value: string): number | null {
  const normalized = normalizeAmount(value)
    .replace(/\./g, "")
    .replace(",", ".");

  if (!normalized || normalized === "-" || normalized === "+") return null;

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}