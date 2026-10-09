import { afterEach, describe, expect, it, vi } from 'vitest';
import { isGoogleAuthEnabled } from '@/constants/features';

afterEach(() => vi.unstubAllEnvs());

describe('connexion Google', () => {
  it('reste masquée tant qu’elle n’est pas configurée dans Supabase', () => {
    vi.stubEnv('NEXT_PUBLIC_GOOGLE_AUTH', '');
    expect(isGoogleAuthEnabled()).toBe(false);
  });

  it('s’active avec NEXT_PUBLIC_GOOGLE_AUTH=on', () => {
    vi.stubEnv('NEXT_PUBLIC_GOOGLE_AUTH', 'on');
    expect(isGoogleAuthEnabled()).toBe(true);
  });
});
