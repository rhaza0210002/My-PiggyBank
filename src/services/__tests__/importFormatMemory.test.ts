import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  IMPORT_FORMATS_KEY,
  countRememberedFormats,
  forgetFormats,
  formatSignature,
  recallMapping,
  rememberMapping,
} from '@/services/importFormatMemory';
import type { ColumnMapping, CsvTable } from '@/utils/statementImport/types';

const mapping = (date: number): ColumnMapping => ({
  date,
  label: 1,
  detail: null,
  amount: { kind: 'split', debit: 3, credit: 2 },
  decimal: ',',
  dateOrder: 'dmy',
});

const table = (headers: string[], hasHeader = true): CsvTable => ({
  separator: ';',
  hasHeader,
  headers,
  rows: [['02/09/2026', 'CB CARREFOUR', '', '-54,20', '1 245,80']],
});

let store: Map<string, string>;
let broken = false;

beforeEach(() => {
  store = new Map();
  broken = false;
  vi.useFakeTimers();
  vi.stubGlobal('window', {
    localStorage: {
      getItem: (key: string) => {
        if (broken) throw new Error('refusé');
        return store.get(key) ?? null;
      },
      setItem: (key: string, value: string) => {
        if (broken) throw new Error('refusé');
        store.set(key, value);
      },
      removeItem: (key: string) => {
        if (broken) throw new Error('refusé');
        store.delete(key);
      },
    },
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('importFormatMemory : se souvenir des réponses, sur l’appareil seulement', () => {
  it('rappelle une association enregistrée pour le même format', () => {
    const signature = formatSignature(table(['Date', 'Libellé', 'Montant 1', 'Montant 2', 'Solde']));
    rememberMapping(signature, mapping(0));
    expect(recallMapping(signature)).toEqual(mapping(0));
    expect(countRememberedFormats()).toBe(1);
  });

  it('reconnaît le même format malgré accents et majuscules, et distingue un fichier sans en-tête', () => {
    const a = formatSignature(table(['Date', 'Libellé', 'Montant 1', 'Montant 2', 'Solde']));
    const b = formatSignature(table(['DATE', 'Libelle', 'montant 1', 'Montant 2', 'SOLDE']));
    expect(a).toBe(b);
    expect(formatSignature(table(['Colonne 1', 'Colonne 2', 'Colonne 3', 'Colonne 4', 'Colonne 5'], false))).toContain(
      'sans-entete',
    );
  });

  it('garde 5 formats au plus et oublie celui qui a servi il y a le plus longtemps', () => {
    for (let index = 0; index < 6; index++) {
      vi.setSystemTime(new Date(2026, 9, 1 + index));
      rememberMapping(`format-${index}`, mapping(index));
    }
    expect(countRememberedFormats()).toBe(5);
    expect(recallMapping('format-0')).toBeNull();
    expect(recallMapping('format-5')).toEqual(mapping(5));
  });

  it('ne garde aucune opération ni aucun montant', () => {
    rememberMapping(formatSignature(table(['Date', 'Libellé', 'Montant 1', 'Montant 2', 'Solde'])), mapping(0));
    const stored = store.get(IMPORT_FORMATS_KEY) ?? '';
    expect(stored).not.toContain('54,20');
    expect(stored).not.toContain('CARREFOUR');
  });

  it('traite un contenu abîmé comme vide', () => {
    store.set(IMPORT_FORMATS_KEY, '{pas du json');
    expect(recallMapping('format-0')).toBeNull();
    expect(countRememberedFormats()).toBe(0);
  });

  it('ne plante jamais quand le navigateur refuse le stockage', () => {
    broken = true;
    expect(() => rememberMapping('format-0', mapping(0))).not.toThrow();
    expect(recallMapping('format-0')).toBeNull();
    expect(countRememberedFormats()).toBe(0);
    expect(() => forgetFormats()).not.toThrow();
  });

  it('oublie tout sur demande', () => {
    rememberMapping('format-0', mapping(0));
    forgetFormats();
    expect(countRememberedFormats()).toBe(0);
  });
});
