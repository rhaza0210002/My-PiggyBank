import { describe, expect, it } from 'vitest';
import { isAmountCell } from '@/utils/statementImport/cells';
import { readCsvTable } from '@/utils/statementImport/csvTable';
import { detectMapping } from '@/utils/statementImport/detectMapping';
import type { CsvTable } from '@/utils/statementImport/types';
import {
  AMBIGUOUS_DATES_CSV,
  DEBITS_ONLY_CSV,
  DEBIT_CREDIT_CSV,
  DOT_DECIMAL_CSV,
  MDY_CSV,
  SG_CSV,
  TWO_AMOUNTS_CSV,
} from './fixtures';

const detect = (csv: string) => detectMapping(readCsvTable(csv)!);

/** Toutes les colonnes que l'association utilise. */
const usedColumns = ({ mapping }: ReturnType<typeof detect>) => [
  mapping.date,
  mapping.label,
  mapping.detail,
  ...(mapping.amount.kind === 'single' ? [mapping.amount.column] : [mapping.amount.debit, mapping.amount.credit]),
];

describe('isAmountCell', () => {
  it.each(['1.234,56', '1 234,56', '1 234,56', '-1,234.56', '(12,00)', '12,00 €', '-54,20', '1850.00'])(
    'reconnaît %s comme un montant',
    (value) => expect(isAmountCell(value)).toBe(true),
  );

  it.each(['EUR', '06/07/2026', '', 'CB CARREFOUR'])('ne prend pas « %s » pour un montant', (value) =>
    expect(isAmountCell(value)).toBe(false),
  );
});

describe('detectMapping : reconnaître les colonnes par leur contenu', () => {
  it('Société Générale : date, libellé, détail et montant unique, sans doute', () => {
    const result = detect(SG_CSV);
    expect(result.mapping).toEqual({
      date: 0,
      label: 1,
      detail: 2,
      amount: { kind: 'single', column: 3 },
      decimal: ',',
      dateOrder: 'dmy',
    });
    expect(result.doubts).toEqual([]);
  });

  it('recombine débit et crédit et ne prend jamais le solde', () => {
    const result = detect(DEBIT_CREDIT_CSV);
    expect(result.mapping.amount).toEqual({ kind: 'split', debit: 2, credit: 3 });
    expect(usedColumns(result)).not.toContain(4);
    expect(result.doubts).toEqual([]);
  });

  it('lit le point décimal et les dates ISO', () => {
    const result = detect(DOT_DECIMAL_CSV);
    expect(result.mapping.decimal).toBe('.');
    expect(result.mapping.date).toBe(0);
    expect(result.mapping.label).toBe(1);
    expect(result.mapping.amount).toEqual({ kind: 'single', column: 2 });
    expect(result.doubts).toEqual([]);
  });

  it('reconnaît des dates mois/jour prouvées par un jour supérieur à 12', () => {
    const result = detect(MDY_CSV);
    expect(result.mapping.dateOrder).toBe('mdy');
    expect(result.doubts).not.toContain('ordreDate');
  });

  it('suppose jour/mois mais signale le doute quand les dates se lisent dans les deux sens', () => {
    const result = detect(AMBIGUOUS_DATES_CSV);
    expect(result.mapping.dateOrder).toBe('dmy');
    expect(result.doubts).toContain('ordreDate');
  });

  it('signale le doute sur deux colonnes de montant sans nom clair, en supposant sorties/entrées par le signe', () => {
    const result = detect(TWO_AMOUNTS_CSV);
    expect(result.doubts).toContain('montant');
    expect(result.mapping.amount).toEqual({ kind: 'split', debit: 3, credit: 2 });
    expect(usedColumns(result)).not.toContain(4);
  });

  it('signale l’absence de date', () => {
    const table: CsvTable = {
      separator: ';',
      hasHeader: true,
      headers: ['Libellé', 'Montant', 'Note'],
      rows: [
        ['CB CARREFOUR', '-54,20', 'a'],
        ['VIR SALAIRE', '1850,00', 'b'],
      ],
    };
    const result = detectMapping(table);
    expect(result.mapping.date).toBeNull();
    expect(result.doubts).toContain('date');
  });
});

describe('detectMapping : colonnes Débit / Crédit dont une est vide sur le mois', () => {
  it('garde Débit et Crédit sans question, pour ne jamais lire une dépense comme une rentrée', () => {
    const { mapping, doubts } = detect(DEBITS_ONLY_CSV);
    expect(mapping.amount).toEqual({ kind: 'split', debit: 2, credit: 3 });
    expect(doubts).not.toContain('montant');
  });
});
