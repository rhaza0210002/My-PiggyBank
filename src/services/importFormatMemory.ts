import { normalizeHeader } from '@/utils/statementImport/cells';
import type { ColumnMapping, CsvTable } from '@/utils/statementImport/types';

/**
 * Réponses aux questions d'import, retenues par « forme » de fichier (séparateur, colonnes) dans le navigateur
 * seulement : jamais d'opération ni de montant, jamais envoyé à Supabase. Le mois suivant, même fichier, pas de question.
 */
export const IMPORT_FORMATS_KEY = 'piggy-formats-import';

const VERSION = 1;
const MAX_FORMATS = 5;

interface RememberedFormat {
  signature: string;
  mapping: ColumnMapping;
  lastUsed: number;
}

interface StoredShape {
  version: number;
  formats: RememberedFormat[];
}

function storage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

function read(): RememberedFormat[] {
  try {
    const raw = storage()?.getItem(IMPORT_FORMATS_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw) as Partial<StoredShape>;
    if (data?.version !== VERSION || !Array.isArray(data.formats)) return [];
    return data.formats.filter(
      (format) => typeof format?.signature === 'string' && typeof format.mapping === 'object' && format.mapping !== null,
    );
  } catch {
    return [];
  }
}

function write(formats: RememberedFormat[]): void {
  try {
    storage()?.setItem(IMPORT_FORMATS_KEY, JSON.stringify({ version: VERSION, formats } satisfies StoredShape));
  } catch {
    // Stockage refusé (navigation privée stricte) : on ne retient rien, les questions reviendront.
  }
}

export function formatSignature(table: CsvTable): string {
  const columns = table.hasHeader ? table.headers.map(normalizeHeader).join('|') : 'sans-entete';
  return [table.separator, table.headers.length, columns].join('#');
}

export function recallMapping(signature: string): ColumnMapping | null {
  return read().find((format) => format.signature === signature)?.mapping ?? null;
}

export function rememberMapping(signature: string, mapping: ColumnMapping): void {
  const others = read().filter((format) => format.signature !== signature);
  const formats = [{ signature, mapping, lastUsed: Date.now() }, ...others]
    .sort((a, b) => b.lastUsed - a.lastUsed)
    .slice(0, MAX_FORMATS);
  write(formats);
}

export function countRememberedFormats(): number {
  return read().length;
}

export function forgetFormats(): void {
  try {
    storage()?.removeItem(IMPORT_FORMATS_KEY);
  } catch {
    // Rien à effacer si le stockage est refusé.
  }
}
