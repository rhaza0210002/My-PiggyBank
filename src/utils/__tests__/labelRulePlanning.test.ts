import { describe, expect, it } from 'vitest';
import { planRuleChanges, type ExistingRule } from '@/utils/labelRulePlanning';

const USER = 'user-1';
const OTHER = 'user-2';

function rule(overrides: Partial<ExistingRule>): ExistingRule {
  return { id: 'r1', label: 'orange', key: 'phone', id_cat: 'tel', user_id: null, ...overrides };
}

describe('planRuleChanges', () => {
  it('crée une règle personnelle pour un libellé inconnu', () => {
    const plan = planRuleChanges([{ label: 'Boulangerie', key: 'alimentation', categoryId: 'ali' }], [], USER);

    expect(plan.inserts).toEqual([{ label: 'Boulangerie', key: 'alimentation', id_cat: 'ali' }]);
    expect(plan.updates).toEqual([]);
  });

  it('ne fait rien si une règle par défaut identique existe déjà', () => {
    const plan = planRuleChanges(
      [{ label: 'Orange', key: 'phone', categoryId: 'tel' }],
      [rule({})],
      USER,
    );

    expect(plan).toEqual({ inserts: [], updates: [], unchanged: 1 });
  });

  it('ne modifie jamais une règle par défaut : crée une règle personnelle qui diffère', () => {
    const plan = planRuleChanges(
      [{ label: 'orange', key: 'internet', categoryId: 'net' }],
      [rule({})],
      USER,
    );

    expect(plan.updates).toEqual([]);
    expect(plan.inserts).toEqual([{ label: 'orange', key: 'internet', id_cat: 'net' }]);
  });

  it('met à jour sa propre règle quand elle change', () => {
    const plan = planRuleChanges(
      [{ label: 'orange', key: 'internet', categoryId: 'net' }],
      [rule({ id: 'mine', user_id: USER })],
      USER,
    );

    expect(plan.updates).toEqual([{ id: 'mine', label: 'orange', key: 'internet', id_cat: 'net' }]);
    expect(plan.inserts).toEqual([]);
  });

  it('ignore les règles d’un autre utilisateur', () => {
    const plan = planRuleChanges(
      [{ label: 'orange', key: 'phone', categoryId: 'tel' }],
      [rule({ id: 'theirs', user_id: OTHER })],
      USER,
    );

    expect(plan.updates).toEqual([]);
    expect(plan.inserts).toHaveLength(1);
  });

  it('compare sans tenir compte des accents ni de la casse, et dédoublonne', () => {
    const plan = planRuleChanges(
      [
        { label: 'Café', key: 'k', categoryId: 'c' },
        { label: ' cafe ', key: 'k', categoryId: 'c' },
      ],
      [],
      USER,
    );

    expect(plan.inserts).toHaveLength(1);
  });

  it('écarte les règles incomplètes', () => {
    const plan = planRuleChanges([{ label: '', key: 'k', categoryId: 'c' }, { label: 'x', key: '', categoryId: 'c' }], [], USER);

    expect(plan.inserts).toEqual([]);
  });
});
