import { describe, expect, it } from 'vitest';
import { readCsvTable, splitCsvRecords } from '@/utils/statementImport/csvTable';
import {
  DOT_DECIMAL_CSV,
  NO_HEADER_CSV,
  QUOTED_CSV,
  SG_CSV,
  TOTAL_LINE_CSV,
} from './fixtures';

describe('splitCsvRecords : découpage conforme au CSV', () => {
  it('ne coupe pas sur un séparateur entre guillemets et lit les guillemets doublés', () => {
    expect(splitCsvRecords('a;"b;c";"d ""e"""', ';')).toEqual([['a', 'b;c', 'd "e"']]);
  });

  it('garde un retour à la ligne entre guillemets dans la même case', () => {
    expect(splitCsvRecords('a;"ligne 1\nligne 2";c\nx;y;z', ';')).toEqual([
      ['a', 'ligne 1\nligne 2', 'c'],
      ['x', 'y', 'z'],
    ]);
  });
});

describe('readCsvTable : trouver le tableau des opérations', () => {
  it('saute les lignes de compte de la banque et garde l’en-tête', () => {
    const table = readCsvTable(SG_CSV)!;
    expect(table.separator).toBe(';');
    expect(table.hasHeader).toBe(true);
    expect(table.headers[0]).toBe("Date de l'opération");
    expect(table.rows).toHaveLength(4);
    expect(table.rows[0][1]).toBe('CB CARREFOUR');
  });

  it('garde un « ; » écrit dans un libellé entre guillemets', () => {
    expect(readCsvTable(QUOTED_CSV)!.rows[0]).toContain('RESTO; LE COIN');
  });

  it('reconnaît la virgule comme séparateur malgré les virgules entre guillemets', () => {
    const table = readCsvTable(DOT_DECIMAL_CSV)!;
    expect(table.separator).toBe(',');
    expect(table.rows[0]).toEqual(['2026-09-02', 'GROCERY STORE', '-1,234.56']);
  });

  it('nomme les colonnes d’un fichier sans en-tête', () => {
    const table = readCsvTable(NO_HEADER_CSV)!;
    expect(table.hasHeader).toBe(false);
    expect(table.headers).toEqual(['Colonne 1', 'Colonne 2', 'Colonne 3']);
    expect(table.rows[0][1]).toBe('CB CARREFOUR');
    expect(table.rows).toHaveLength(3);
  });

  it('ignore une ligne de total plus courte en bas du fichier', () => {
    expect(readCsvTable(TOTAL_LINE_CSV)!.rows).toHaveLength(4);
  });

  it('ne trouve rien dans un texte qui n’est pas un relevé', () => {
    expect(readCsvTable('bonjour\nau revoir')).toBeNull();
  });
});
