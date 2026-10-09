import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/supabaseClient', () => ({ supabase: {} }));

import CsvTransactionsTable from '@/components/features/tables/CsvTransactionsTable';
import { buildDemoTransactions } from '@/utils/demoStatement';

const transactions = buildDemoTransactions([], new Date(2026, 9, 9));

describe('CsvTransactionsTable en exemple', () => {
  const html = renderToStaticMarkup(<CsvTransactionsTable transactions={transactions} isDemo />);

  it('laisse enregistrer les opérations d’exemple (sur l’appareil)', () => {
    const save = html.match(/<button[^>]*>Enregistrer les 8 transactions<\/button>/)?.[0] ?? '';
    expect(save).not.toBe('');
    expect(save).not.toContain('disabled=""');
  });

  it('garde les libellés désactivés et explique pourquoi', () => {
    const labels = html.match(/<button[^>]*>Enregistrer les libellés reconnus<\/button>/)?.[0] ?? '';
    expect(labels).toContain('disabled=""');
    expect(html).toContain('Désactivé en exemple : il écrirait des règles dans ton vrai compte.');
  });

  it('explique où vont les opérations', () => {
    expect(html).toContain('Exemple : ces opérations restent sur cet appareil. Enregistre-les pour les retrouver dans Pointer.');
  });
});

describe('CsvTransactionsTable hors exemple', () => {
  it('n’affiche aucune note d’exemple', () => {
    const html = renderToStaticMarkup(<CsvTransactionsTable transactions={transactions} />);
    expect(html).not.toContain('Exemple :');
    expect(html).not.toContain('Désactivé en exemple');
  });
});
