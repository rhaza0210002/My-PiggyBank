import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/services/transactionCategoryService', () => ({ getLibelleTransacts: async () => [] }));
vi.mock('@/components/features/tables/CsvTransactionsTable', () => ({ default: () => null }));
vi.mock('next/link', () => ({ default: ({ children }: { children: unknown }) => children }));

const { default: CsvUploaderPage } = await import('../page');

describe('page Import de relevé', () => {
  const html = renderToStaticMarkup(<CsvUploaderPage />);

  it('dit ce qui se passe avec le fichier et les opérations, sans promesse inexacte', () => {
    expect(html).toContain('Ton fichier est lu sur ton appareil et n’est jamais envoyé.');
    expect(html).toContain('gardées jusqu’à 30 jours après la clôture du mois');
    expect(html).toContain('Tu peux les effacer toi-même à tout moment.');
    expect(html).not.toContain('jamais envoyé ni stocké');
  });

  it('explique le geste en une phrase', () => {
    expect(html).toContain('Dépose le CSV de ta banque : on range les opérations pour toi, tu vérifies, c’est tout.');
  });

  it('annonce le résultat aux lecteurs d’écran dans une zone de statut', () => {
    expect(html).toMatch(/<p[^>]*role="status"/);
  });
});
