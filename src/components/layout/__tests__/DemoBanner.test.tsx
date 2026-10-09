import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/supabaseClient', () => ({ supabase: {} }));

import DemoBanner, { DEMO_BANNER_TEXT } from '@/components/layout/DemoBanner';

describe('DemoBanner', () => {
  it('ne montre rien tant que le mode exemple n’est pas actif', () => {
    expect(renderToStaticMarkup(<DemoBanner />)).toBe('');
  });

  it('dit clairement que les opérations sont fictives et restent sur l’appareil', () => {
    expect(DEMO_BANNER_TEXT).toBe('Mode exemple : ces opérations sont fictives et restent sur cet appareil.');
  });
});
