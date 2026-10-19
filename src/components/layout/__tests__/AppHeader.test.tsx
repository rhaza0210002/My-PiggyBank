import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({ usePathname: () => '/tableau-de-bord', useRouter: () => ({}) }));
vi.mock('@/lib/supabaseClient', () => ({ supabase: { auth: { getSession: async () => ({ data: { session: null } }) } } }));

import AppHeader from '@/components/layout/AppHeader';

describe('AppHeader', () => {
  it('affiche le logo officiel dans le lien de retour à l’accueil, avec un nom accessible', () => {
    const html = renderToStaticMarkup(<AppHeader />);
    expect(html).toMatch(/<img[^>]*alt="My PiggyBank"[^>]*logo-my-piggybank\.png/);
    expect(html).toContain('aria-label="My PiggyBank, retour à l&#x27;accueil"');
  });
});
