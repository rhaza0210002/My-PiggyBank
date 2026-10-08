import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import BalanceToggle, { MASKED_AMOUNT, revealAmount } from '@/components/ui/BalanceToggle';

describe('solde masqué', () => {
  it('remplace le montant tant que le solde est caché, sans le laisser dans le texte', () => {
    expect(revealAmount(false, '+1 184,33 €')).toBe(MASKED_AMOUNT);
    expect(revealAmount(false, '+1 184,33 €')).not.toMatch(/\d/);
  });

  it('montre le montant une fois révélé', () => {
    expect(revealAmount(true, '+1 184,33 €')).toBe('+1 184,33 €');
  });

  it('propose un bouton nommé et son état pour les lecteurs d’écran', () => {
    const hidden = renderToStaticMarkup(<BalanceToggle isShown={false} onToggle={() => {}} />);
    expect(hidden).toContain('aria-label="Afficher le solde du mois"');
    expect(hidden).toContain('aria-pressed="false"');

    const shown = renderToStaticMarkup(<BalanceToggle isShown onToggle={() => {}} subject="le solde général" />);
    expect(shown).toContain('aria-label="Cacher le solde général"');
    expect(shown).toContain('aria-pressed="true"');
  });
});
