import { describe, expect, it } from 'vitest';
import { browserSupabaseUrl, sessionCookieName } from '@/lib/supabaseUrl';

describe('browserSupabaseUrl', () => {
  it('garde l’adresse directe hors séance de test', () => {
    expect(browserSupabaseUrl('https://abc.supabase.co', 'https://piggy.example', false)).toBe('https://abc.supabase.co');
  });

  it('passe par l’app pendant une séance de test', () => {
    expect(browserSupabaseUrl('http://127.0.0.1:55321', 'https://x-y.trycloudflare.com', true)).toBe(
      'https://x-y.trycloudflare.com/supabase',
    );
  });

  it('garde l’adresse directe côté serveur (pas d’origine)', () => {
    expect(browserSupabaseUrl('http://127.0.0.1:55321', null, true)).toBe('http://127.0.0.1:55321');
  });
});

describe('sessionCookieName', () => {
  it('donne le même nom que @supabase/ssr, quelle que soit l’adresse du tunnel', () => {
    expect(sessionCookieName('https://uwszahzlzopzguvkrliu.supabase.co')).toBe('sb-uwszahzlzopzguvkrliu-auth-token');
    expect(sessionCookieName('http://127.0.0.1:55321')).toBe('sb-127-auth-token');
  });
});
