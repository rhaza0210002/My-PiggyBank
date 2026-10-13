import { applyMapping } from './applyMapping';
import { readCsvTable } from './csvTable';
import { detectMapping } from './detectMapping';
import { isOfx, parseOfx } from './ofx';
import type { ColumnMapping, Doubt, ReadResult } from './types';

export const EMPTY_FILE_MESSAGE =
  'Ce fichier est vide ou illisible. Vérifie que c’est bien le relevé exporté par ta banque.';
export const NO_OPERATIONS_MESSAGE =
  'Ce fichier ne contient pas d’opérations lisibles. Ta banque propose peut-être un export « CSV » ou « OFX » : essaie avec celui-là.';
export const EMPTY_OFX_MESSAGE = 'Ce relevé ne contient aucune opération sur la période choisie.';

/** Au-delà de cette part de lignes illisibles, on fait vérifier les colonnes. */
const UNREADABLE_SHARE = 0.05;

/**
 * Lecture complète d'un relevé : OFX ou CSV, colonnes devinées (ou reprises de la mémoire de l'appareil),
 * opérations, et doutes qui justifient des questions. Les erreurs sont des phrases simples, jamais techniques.
 */
export function readStatement(text: string, remembered?: ColumnMapping | null): ReadResult {
  if (text.trim() === '') return { kind: 'error', message: EMPTY_FILE_MESSAGE };

  if (isOfx(text)) {
    const lines = parseOfx(text);
    return lines.length > 0 ? { kind: 'ofx', lines } : { kind: 'error', message: EMPTY_OFX_MESSAGE };
  }

  const table = readCsvTable(text);
  if (!table) return { kind: 'error', message: NO_OPERATIONS_MESSAGE };

  const detected = remembered ? null : detectMapping(table);
  const mapping = remembered ?? detected!.mapping;
  const { lines, unreadable } = applyMapping(table, mapping);

  const doubts: Doubt[] = detected ? [...detected.doubts] : [];
  if (unreadable / table.rows.length > UNREADABLE_SHARE) doubts.push('illisibles');

  return { kind: 'csv', table, mapping, doubts, lines, fromMemory: Boolean(remembered) };
}
