import { afterEach, describe, expect, it, vi } from 'vitest';

const signInWithOAuth = vi.fn<(...args: unknown[]) => Promise<{ error: null }>>(async () => ({ error: null }));
vi.mock('@/lib/supabaseClient', () => ({ supabase: { auth: { signInWithOAuth: (...args: unknown[]) => signInWithOAuth(...args) } } }));

import { signInWithGoogle } from '@/services/authService';

afterEach(() => vi.unstubAllGlobals());

describe('signInWithGoogle', () => {
  it('demande toujours à Google d’afficher le choix du compte Gmail, puis revient sur le callback', async () => {
    vi.stubGlobal('window', { location: { origin: 'http://localhost:3000' } });
    await signInWithGoogle();
    expect(signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: { redirectTo: 'http://localhost:3000/auth/callback', queryParams: { prompt: 'select_account' } },
    });
  });
});
