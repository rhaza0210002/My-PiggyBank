import { describe, expect, it } from 'vitest';
import type { BankTransaction } from '@/services/csvParser';
import { prepareTransactionsForStorage } from '@/utils/transactionDedupe';

function transaction(overrides: Partial<BankTransaction>): BankTransaction {
  return {
    id: 'x',
    date: '07/09/2026',
    label: 'Libellé',
    detail: 'détail',
    rawDetail: 'PRELEVEMENT ORANGE',
    amount: -29.99,
    categoryId: null,
    categoryLabel: null,
    categoryKey: null,
    type: 'VIREMENT_SORTANT',
    ...overrides,
  };
}

describe('prepareTransactionsForStorage', () => {
  it('construit une clé stable à partir de la date, du montant et du libellé brut', () => {
    const { rows } = prepareTransactionsForStorage([transaction({})]);

    expect(rows).toHaveLength(1);
    expect(rows[0].booked_on).toBe('2026-09-07');
    expect(rows[0].dedupe_key).toBe('2026-09-07|-29.99|prelevement orange|1');
  });

  it('ne dépend pas de la catégorie : réimporter après une nouvelle règle donne la même clé', () => {
    const [before] = prepareTransactionsForStorage([transaction({})]).rows;
    const [after] = prepareTransactionsForStorage([
      transaction({ categoryId: 'cat-1', categoryKey: 'Internet' }),
    ]).rows;

    expect(after.dedupe_key).toBe(before.dedupe_key);
  });

  it('distingue deux opérations identiques le même jour par un rang', () => {
    const { rows } = prepareTransactionsForStorage([transaction({}), transaction({})]);

    expect(rows.map((row) => row.dedupe_key)).toEqual([
      '2026-09-07|-29.99|prelevement orange|1',
      '2026-09-07|-29.99|prelevement orange|2',
    ]);
  });

  it('normalise les espaces et la casse du libellé', () => {
    const [first] = prepareTransactionsForStorage([transaction({ rawDetail: ' Prelevement   ORANGE ' })]).rows;

    expect(first.dedupe_key).toBe('2026-09-07|-29.99|prelevement orange|1');
  });

  it('écarte les lignes sans date valide', () => {
    const { rows, invalid } = prepareTransactionsForStorage([transaction({ date: '31/02/2026' })]);

    expect(rows).toHaveLength(0);
    expect(invalid).toHaveLength(1);
  });
});
