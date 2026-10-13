import { describe, expect, it } from 'vitest';
import { readCsvTable } from '@/utils/statementImport/csvTable';
import { detectMapping } from '@/utils/statementImport/detectMapping';
import {
  answerAmountShape,
  answerColumn,
  answerDateOrder,
  buildQuestions,
  doubtReason,
  missingParts,
  selectableColumns,
} from '@/utils/statementImport/mappingQuestions';
import type { ColumnMapping } from '@/utils/statementImport/types';
import { AMBIGUOUS_DATES_CSV, SG_CSV, TWO_AMOUNTS_CSV } from './fixtures';

const twoAmounts = readCsvTable(TWO_AMOUNTS_CSV)!;
const guess = detectMapping(twoAmounts).mapping;

describe('buildQuestions : une question par doute', () => {
  it('montant en deux colonnes : la forme, puis les sorties, puis les entrées', () => {
    expect(buildQuestions(['montant'], guess, twoAmounts)).toEqual([
      { kind: 'amountShape' },
      { kind: 'column', role: 'debit' },
      { kind: 'column', role: 'credit' },
    ]);
  });

  it('montant en une colonne : la forme, puis la colonne', () => {
    const single = answerAmountShape(guess, 'single');
    expect(buildQuestions(['montant'], single, twoAmounts)).toEqual([
      { kind: 'amountShape' },
      { kind: 'column', role: 'amount' },
    ]);
  });

  it('demande la colonne de la date quand elle manque', () => {
    expect(buildQuestions(['date'], guess, twoAmounts)).toEqual([{ kind: 'column', role: 'date' }]);
  });

  it('demande le sens des dates avec un exemple ambigu tiré du fichier', () => {
    const table = readCsvTable(AMBIGUOUS_DATES_CSV)!;
    expect(buildQuestions(['ordreDate'], detectMapping(table).mapping, table)).toEqual([
      { kind: 'dateOrder', sample: '06/07/2026' },
    ]);
  });

  it('fait vérifier toutes les colonnes quand des lignes sont illisibles', () => {
    const sg = readCsvTable(SG_CSV)!;
    expect(buildQuestions(['illisibles'], detectMapping(sg).mapping, sg)).toEqual([
      { kind: 'column', role: 'date' },
      { kind: 'column', role: 'label' },
      { kind: 'amountShape' },
      { kind: 'column', role: 'amount' },
    ]);
  });
});

describe('réponses', () => {
  it('une colonne choisie quitte son ancien rôle', () => {
    const next = answerColumn(guess, 'debit', 2);
    expect(next.amount).toEqual({ kind: 'split', debit: 2, credit: null });
  });

  it('passer en une colonne garde la colonne supposée', () => {
    expect(answerAmountShape(guess, 'single').amount).toEqual({ kind: 'single', column: 3 });
    expect(answerAmountShape(answerAmountShape(guess, 'single'), 'split').amount).toEqual({
      kind: 'split',
      debit: 3,
      credit: null,
    });
  });

  it('change le sens des dates', () => {
    expect(answerDateOrder(guess, 'mdy').dateOrder).toBe('mdy');
  });

  it('ne propose jamais la colonne solde pour un montant', () => {
    expect(selectableColumns(twoAmounts, 'debit')).toEqual([0, 1, 2, 3]);
    expect(selectableColumns(twoAmounts, 'label')).toEqual([0, 1, 2, 3, 4]);
  });
});

describe('missingParts et doubtReason', () => {
  it('dit ce qui manque en mots simples', () => {
    const empty: ColumnMapping = { ...guess, date: null, label: null, amount: { kind: 'single', column: null } };
    expect(missingParts(empty)).toEqual(['la date', 'le libellé', 'le montant']);
    expect(missingParts(guess)).toEqual([]);
  });

  it('explique pourquoi on pose des questions', () => {
    expect(doubtReason(['montant'])).toBe(
      'On n’est pas sûrs de la colonne du montant. Quelques petites questions et c’est fini.',
    );
  });
});
