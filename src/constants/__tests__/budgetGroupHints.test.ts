import { describe, expect, it } from 'vitest';
import { getGroupHint } from '@/constants/budgetGroupHints';

describe('explications des groupes du budget', () => {
  it('explique les trois groupes de départ', () => {
    ['decaissement', 'reserve', 'revenus'].forEach((key) => expect(getGroupHint(key)?.length).toBeGreaterThan(20));
  });

  it('ne dit rien d’un groupe inconnu plutôt que d’inventer', () => {
    expect(getGroupHint('autre')).toBeUndefined();
  });
});
