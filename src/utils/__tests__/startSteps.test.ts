import { describe, expect, it } from 'vitest';
import { getNextStep, getStartSteps } from '@/utils/startSteps';

describe('premiers pas', () => {
  it('commence par l’import pour un nouvel utilisateur', () => {
    const steps = getStartSteps({ hasOperations: false, hasBudget: false, reconciledOperations: 0 });
    expect(steps.map((step) => step.id)).toEqual(['import', 'budget', 'reconcile']);
    expect(getNextStep(steps)?.id).toBe('import');
  });

  it('propose le premier pas non fait, même si un pas suivant l’est déjà', () => {
    const steps = getStartSteps({ hasOperations: true, hasBudget: false, reconciledOperations: 3 });
    expect(getNextStep(steps)?.id).toBe('budget');
  });

  it('ne propose plus rien quand tout est fait', () => {
    const steps = getStartSteps({ hasOperations: true, hasBudget: true, reconciledOperations: 1 });
    expect(getNextStep(steps)).toBeUndefined();
  });
});
