import { describe, expect, it } from 'vitest';
import { applyMapping, normalizeDate, parseAmount } from '@/utils/statementImport/applyMapping';
import { readCsvTable } from '@/utils/statementImport/csvTable';
import { detectMapping } from '@/utils/statementImport/detectMapping';
import type { ColumnMapping } from '@/utils/statementImport/types';
import { DEBIT_CREDIT_CSV, SG_CSV } from './fixtures';

describe('parseAmount', () => {
  it.each([
    ['1234.56', '.', 1234.56],
    ['1.234,56', ',', 1234.56],
    ['1 234,56', ',', 1234.56],
    ['1 234,56', ',', 1234.56],
    ['-1,234.56', '.', -1234.56],
    ['(12,00)', ',', -12],
    ['12,00 €', ',', 12],
    ['+5', ',', 5],
  ] as const)('%s (décimale « %s ») vaut %s', (value, decimal, expected) => {
    expect(parseAmount(value, decimal)).toBe(expected);
  });

  it('rend null pour une case vide ou sans nombre', () => {
    expect(parseAmount('', ',')).toBeNull();
    expect(parseAmount('EUR', ',')).toBeNull();
  });
});

describe('normalizeDate', () => {
  it('met les dates en jj/mm/aaaa', () => {
    expect(normalizeDate('2/9/26', 'dmy')).toBe('02/09/2026');
    expect(normalizeDate('09/13/2026', 'mdy')).toBe('13/09/2026');
    expect(normalizeDate('2026-09-02', 'dmy')).toBe('02/09/2026');
    expect(normalizeDate('02.09.2026', 'dmy')).toBe('02/09/2026');
  });

  it('refuse une date qui n’existe pas', () => {
    expect(normalizeDate('31/02/2026', 'dmy')).toBeNull();
    expect(normalizeDate('pas une date', 'dmy')).toBeNull();
  });
});

describe('applyMapping', () => {
  it('donne des opérations signées à partir du débit et du crédit', () => {
    const table = readCsvTable(DEBIT_CREDIT_CSV)!;
    const { lines, unreadable } = applyMapping(table, detectMapping(table).mapping);
    expect(unreadable).toBe(0);
    expect(lines[0]).toEqual({ date: '02/09/2026', label: 'CB CARREFOUR', detail: '', amount: -54.2 });
    expect(lines[1].amount).toBe(1850);
  });

  it('garde le détail quand il existe', () => {
    const table = readCsvTable(SG_CSV)!;
    const { lines } = applyMapping(table, detectMapping(table).mapping);
    expect(lines[0]).toEqual({
      date: '02/09/2026',
      label: 'CB CARREFOUR',
      detail: 'CARTE X1234 01/09 CARREFOUR MARKET',
      amount: -54.2,
    });
  });

  it('compte comme illisible une ligne sans date ou sans montant', () => {
    const table = readCsvTable(SG_CSV)!;
    const mapping = detectMapping(table).mapping;
    const broken = { ...table, rows: [...table.rows, ['pas de date', 'X', 'Y', '-1,00', 'EUR'], ['03/09/2026', 'X', 'Y', '', 'EUR']] };
    const { lines, unreadable } = applyMapping(broken, mapping);
    expect(lines).toHaveLength(4);
    expect(unreadable).toBe(2);
  });

  it('ne produit rien tant qu’il manque le libellé', () => {
    const table = readCsvTable(SG_CSV)!;
    const mapping: ColumnMapping = { ...detectMapping(table).mapping, label: null };
    const { lines, unreadable } = applyMapping(table, mapping);
    expect(lines).toEqual([]);
    expect(unreadable).toBe(table.rows.length);
  });
});
