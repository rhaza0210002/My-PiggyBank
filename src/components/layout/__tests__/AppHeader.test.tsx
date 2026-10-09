import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({ usePathname: () => '/tableau-de-bord', useRouter: () => ({}) }));
vi.mock('@/lib/supabaseClient', () => ({ supabase: { auth: { getSession: async () => ({ data: { session: null } }) } } }));

import AppHeader from '@/components/layout/AppHeader';

describe('AppHeader', () => {
  it('libère la place sur tablette : le nom de l’app se cache entre md et lg, le cochon et le nom accessible restent', () => {
    const html = renderToStaticMarkup(<AppHeader />);
    expect(html).toMatch(/<span class="[^"]*md:max-lg:hidden[^"]*">My PiggyBank<\/span>/);
    expect(html).toContain('aria-label="My PiggyBank, retour à l&#x27;accueil"');
  });
});
