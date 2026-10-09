import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import BalanceCard from '@/components/features/dashboard/BalanceCard';

const base = { monthName: 'Octobre', amountText: '+312,40 €', detail: '48,00 € dépensés', onToggle: () => {} };

describe('BalanceCard', () => {
  it('cache le montant par défaut : aucune valeur dans le HTML', () => {
    const html = renderToStaticMarkup(<BalanceCard {...base} isShown={false} />);
    expect(html).toContain('Ton solde');
    expect(html).not.toContain('312');
    expect(html).not.toContain('48,00');
    expect(html).toContain('Montant caché');
    expect(html).toContain('aria-label="Afficher le solde du mois"');
  });

  it('montre le montant et le détail une fois révélé, annoncés poliment', () => {
    const html = renderToStaticMarkup(<BalanceCard {...base} isShown />);
    expect(html).toContain('+312,40 €');
    expect(html).toContain('48,00 € dépensés');
    expect(html).toContain('aria-live="polite"');
    expect(html).not.toContain('Montant caché');
  });

  it('est une région nommée par son titre', () => {
    const html = renderToStaticMarkup(<BalanceCard {...base} isShown={false} />);
    expect(html).toMatch(/<section[^>]*aria-labelledby="([^"]+)"/);
  });

  it('indique quand il n’y a pas encore de solde à montrer', () => {
    const html = renderToStaticMarkup(<BalanceCard {...base} amountText={null} detail={null} isShown />);
    expect(html).toContain('Importe un relevé pour voir ton solde');
  });
});
