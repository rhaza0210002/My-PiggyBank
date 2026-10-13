import { describe, expect, it } from 'vitest';
import { categorizeLines } from '@/services/csvParser';
import type { LibelleTransact } from '@/services/transactionCategoryService';
import { prepareTransactionsForStorage } from '@/utils/transactionDedupe';
import { readStatement } from '@/utils/statementImport/readStatement';
import { SG_CSV } from '@/utils/statementImport/__tests__/fixtures';

const sgLines = () => {
  const result = readStatement(SG_CSV);
  if (result.kind !== 'csv') throw new Error('SG_CSV doit se lire comme un CSV');
  return result.lines;
};

describe('categorizeLines', () => {
  it('garde les clés de doublons de l’ancien lecteur Société Générale (aucun ré-import en double)', () => {
    // Clés produites par SocieteGeneraleParser sur SG_CSV juste avant sa suppression.
    const before = [
      '2026-09-02|-54.20|carte x1234 01/09 carrefour market|1',
      '2026-09-03|1850.00|vir recu 123 de: employeur sa|1',
      '2026-09-05|-72.00|prelevement europeen edf clients|1',
      '2026-09-12|-13.49|prelevement netflix.com|1',
    ];
    const after = prepareTransactionsForStorage(categorizeLines(sgLines(), [])).rows.map((row) => row.dedupe_key);
    expect(after).toEqual(before);
  });

  it('prend le libellé quand le détail est vide', () => {
    const [transaction] = categorizeLines([{ date: '02/09/2026', label: 'CARREFOUR', detail: '', amount: -5 }], []);
    expect(transaction.rawDetail).toBe('CARREFOUR');
  });

  it('reconnaît un virement reçu', () => {
    const transactions = categorizeLines(sgLines(), []);
    expect(transactions[1].type).toBe('VIREMENT_ENTRANT');
    expect(transactions[0].type).toBe('AUTRE');
  });

  it('applique les règles de libellés comme avant', () => {
    const rules = [{ label: 'carrefour', key: 'alimentation', id_cat: 'c1' }] as LibelleTransact[];
    const [carrefour, salaire] = categorizeLines(sgLines(), rules);
    expect(carrefour.categoryId).toBe('c1');
    expect(carrefour.categoryKey).toBe('alimentation');
    expect(salaire.categoryId).toBeNull();
  });
});
