import { describe, expect, it } from 'vitest';
import { buildContentSecurityPolicy, createNonce } from '@/utils/contentSecurityPolicy';

const base = { nonce: 'abc123', supabaseUrl: 'https://projet.supabase.co', isDev: false };

describe('buildContentSecurityPolicy', () => {
  const csp = buildContentSecurityPolicy(base);

  it('n’exécute que les scripts marqués du nonce de la requête, jamais un script injecté', () => {
    expect(csp).toContain("script-src 'self' 'nonce-abc123' 'strict-dynamic'");
    expect(csp).not.toMatch(/script-src[^;]*unsafe-inline/);
    expect(csp).not.toContain('unsafe-eval');
  });

  it('n’envoie des données qu’à l’app et à Supabase (API et temps réel)', () => {
    expect(csp).toContain("connect-src 'self' https://projet.supabase.co wss://projet.supabase.co");
    expect(csp).toContain("default-src 'self'");
  });

  it('bloque les plugins, les balises base détournées, les formulaires externes et l’intégration en iframe', () => {
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("form-action 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain('upgrade-insecure-requests');
  });

  it('en développement seulement, autorise eval pour les messages d’erreur de React', () => {
    const dev = buildContentSecurityPolicy({ ...base, isDev: true });
    expect(dev).toContain("'unsafe-eval'");
    expect(dev).not.toContain('upgrade-insecure-requests');
  });

  it('sur le Wi-Fi local en http, ne force pas le HTTPS (sinon plus rien ne se charge)', () => {
    expect(buildContentSecurityPolicy({ ...base, isHttps: false })).not.toContain('upgrade-insecure-requests');
  });

  it('ignore un chemin glissé dans l’adresse Supabase', () => {
    const csp2 = buildContentSecurityPolicy({ ...base, supabaseUrl: 'https://projet.supabase.co/rest/v1;script-src *' });
    expect(csp2).toContain('connect-src \'self\' https://projet.supabase.co wss://projet.supabase.co;');
    expect(csp2).not.toContain('script-src *');
  });
});

describe('createNonce', () => {
  it('donne un nonce différent à chaque requête', () => {
    expect(createNonce()).not.toBe(createNonce());
    expect(createNonce()).toMatch(/^[A-Za-z0-9+/=]{20,}$/);
  });
});
