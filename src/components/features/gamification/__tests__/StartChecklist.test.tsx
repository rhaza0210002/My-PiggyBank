import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import StartChecklist from '@/components/features/gamification/StartChecklist';
import { getStartSteps } from '@/utils/startSteps';

const render = (state: Parameters<typeof getStartSteps>[0]) => renderToStaticMarkup(<StartChecklist steps={getStartSteps(state)} />);

describe('StartChecklist', () => {
  it('propose « C’est parti » sur le premier pas à faire', () => {
    const html = render({ hasOperations: false, hasBudget: false, reconciledOperations: 0 });
    expect(html).toContain('C’est parti');
    expect(html).not.toContain('Modifier');
  });

  it('reste affiché quand tout est fait, et le budget se « Modifie » (pour les mois suivants)', () => {
    const html = render({ hasOperations: true, hasBudget: true, reconciledOperations: 2 });
    expect(html).toContain('Pour commencer · 3 sur 3');
    expect(html).toContain('Modifier');
    expect(html).toContain('aria-label="Modifier mon budget : ne change que les mois suivants"');
    expect(html).not.toContain('C’est parti');
  });

  it('garde le budget modifiable même quand un autre pas reste à faire', () => {
    const html = render({ hasOperations: false, hasBudget: true, reconciledOperations: 0 });
    expect(html).toContain('Modifier');
    expect(html).toContain('C’est parti');
  });
});
