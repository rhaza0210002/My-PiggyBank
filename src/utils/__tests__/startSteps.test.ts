import { describe, expect, it } from 'vitest';
import { getNextStep, getStartSteps } from '@/utils/startSteps';

describe('premiers pas', () => {
  it('commence par prévoir le budget, puis importer, puis pointer', () => {
    const steps = getStartSteps({ hasOperations: false, hasBudget: false, reconciledOperations: 0 });
    expect(steps.map((step) => step.id)).toEqual(['budget', 'import', 'reconcile']);
    expect(steps.map((step) => step.title)).toEqual(['Prévoir mon budget', 'Importer mon relevé', 'Pointer mes opérations']);
    expect(getNextStep(steps)?.id).toBe('budget');
  });

  it('propose le premier pas non fait, même si un pas suivant l’est déjà', () => {
    const steps = getStartSteps({ hasOperations: false, hasBudget: true, reconciledOperations: 3 });
    expect(getNextStep(steps)?.id).toBe('import');
  });

  it('ne propose plus rien quand tout est fait', () => {
    const steps = getStartSteps({ hasOperations: true, hasBudget: true, reconciledOperations: 1 });
    expect(getNextStep(steps)).toBeUndefined();
  });
});
