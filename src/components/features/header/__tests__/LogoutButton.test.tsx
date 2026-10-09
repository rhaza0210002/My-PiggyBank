import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: () => {}, refresh: () => {} }) }));
vi.mock('@/lib/supabaseClient', () => ({ supabase: {} }));

import LogoutButton from '@/components/features/header/LogoutButton';

describe('LogoutButton', () => {
  it('garde son libellé visible partout (jamais une icône seule) avec une icône de porte et de flèche', () => {
    const html = renderToStaticMarkup(<LogoutButton variant="compact" />);
    expect(html).toContain('Déconnexion');
    expect(html).not.toContain('sr-only');
    expect(html).toContain('<svg');
    expect(html).not.toContain('🚪');
  });
});
