import { describe, expect, it } from 'vitest';
import {
  EMPTY_FILE_MESSAGE,
  EMPTY_OFX_MESSAGE,
  NO_OPERATIONS_MESSAGE,
  readStatement,
} from '@/utils/statementImport/readStatement';
import type { ColumnMapping } from '@/utils/statementImport/types';
import { OFX_EMPTY, OFX_SGML, SG_CSV, TWO_AMOUNTS_CSV } from './fixtures';

/** Relevé de 20 lignes au format de TWO_AMOUNTS_CSV, dont `broken` ont un montant illisible. */
function twoAmountsFile(broken: number): string {
  const rows = Array.from({ length: 20 }, (_, index) => {
    const day = String(index + 1).padStart(2, '0');
    const amount = index < broken ? 'n/a' : `-${index + 1},00`;
    return `${day}/09/2026;OPERATION ${index};;${amount};100,00`;
  });
  return ['Date;Libellé;Montant 1;Montant 2;Solde', ...rows].join('\n');
}

const REMEMBERED: ColumnMapping = {
  date: 0,
  label: 1,
  detail: null,
  amount: { kind: 'split', debit: 3, credit: 2 },
  decimal: ',',
  dateOrder: 'dmy',
};

describe('readStatement : lire un relevé de bout en bout', () => {
  it('dit simplement qu’un fichier vide est illisible', () => {
    expect(readStatement('')).toEqual({ kind: 'error', message: EMPTY_FILE_MESSAGE });
    expect(readStatement('  \n ')).toEqual({ kind: 'error', message: EMPTY_FILE_MESSAGE });
  });

  it('dit simplement quand il n’y a pas d’opérations lisibles', () => {
    expect(readStatement('bonjour')).toEqual({ kind: 'error', message: NO_OPERATIONS_MESSAGE });
  });

  it('dit simplement quand un OFX ne contient aucune opération', () => {
    expect(readStatement(OFX_EMPTY)).toEqual({ kind: 'error', message: EMPTY_OFX_MESSAGE });
  });

  it('les messages restent en français simple, sans détail technique', () => {
    for (const message of [EMPTY_FILE_MESSAGE, NO_OPERATIONS_MESSAGE, EMPTY_OFX_MESSAGE]) {
      expect(message).not.toMatch(/sql|rls|libelle_transacts|error|exception/i);
    }
  });

  it('lit un OFX sans poser de question', () => {
    const result = readStatement(OFX_SGML);
    expect(result.kind).toBe('ofx');
    if (result.kind === 'ofx') expect(result.lines).toHaveLength(2);
  });

  it('lit le CSV Société Générale sans doute', () => {
    const result = readStatement(SG_CSV);
    expect(result.kind).toBe('csv');
    if (result.kind !== 'csv') return;
    expect(result.doubts).toEqual([]);
    expect(result.lines).toHaveLength(4);
    expect(result.fromMemory).toBe(false);
  });

  it('signale plus de 5 % de lignes illisibles', () => {
    const result = readStatement(twoAmountsFile(2));
    expect(result.kind === 'csv' && result.doubts).toContain('illisibles');
  });

  it('applique les réglages retenus sans reposer de question', () => {
    const result = readStatement(TWO_AMOUNTS_CSV, REMEMBERED);
    expect(result.kind).toBe('csv');
    if (result.kind !== 'csv') return;
    expect(result.fromMemory).toBe(true);
    expect(result.doubts).toEqual([]);
    expect(result.mapping).toEqual(REMEMBERED);
    expect(result.lines[1].amount).toBe(1850);
  });

  it('ne laisse pas la mémoire masquer un fichier abîmé', () => {
    const result = readStatement(twoAmountsFile(3), REMEMBERED);
    expect(result.kind === 'csv' && result.doubts).toEqual(['illisibles']);
  });
});
