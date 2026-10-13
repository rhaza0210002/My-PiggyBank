import { describe, expect, it, vi } from 'vitest';
import { createFreshSessionFetch, isExpiredSessionResponse } from '@/lib/freshSessionFetch';

const expired = () => new Response(JSON.stringify({ code: 'PGRST303', message: 'JWT expired' }), { status: 401 });
const ok = () => new Response('[]', { status: 200 });
const REST = 'https://projet.supabase.co/rest/v1/transactions';

describe('isExpiredSessionResponse', () => {
  it('reconnaît un jeton périmé, mais pas un simple refus', async () => {
    expect(await isExpiredSessionResponse(expired())).toBe(true);
    expect(await isExpiredSessionResponse(new Response('{"message":"permission denied"}', { status: 401 }))).toBe(false);
    expect(await isExpiredSessionResponse(new Response('JWT', { status: 403 }))).toBe(false);
  });
});

describe('createFreshSessionFetch', () => {
  it('renouvelle la session et rejoue la requête avec le nouveau jeton', async () => {
    const baseFetch = vi.fn().mockResolvedValueOnce(expired()).mockResolvedValueOnce(ok());
    const refresh = vi.fn().mockResolvedValue('nouveau');
    const onSessionLost = vi.fn();
    const fetcher = createFreshSessionFetch({ refresh, onSessionLost, baseFetch });

    const response = await fetcher(REST, { method: 'POST', headers: { Authorization: 'Bearer ancien', apikey: 'cle' }, body: '{}' });

    expect(response.status).toBe(200);
    expect(refresh).toHaveBeenCalledOnce();
    const retried = baseFetch.mock.calls[1][1];
    expect(new Headers(retried.headers).get('Authorization')).toBe('Bearer nouveau');
    expect(new Headers(retried.headers).get('apikey')).toBe('cle');
    expect(retried.body).toBe('{}');
    expect(onSessionLost).not.toHaveBeenCalled();
  });

  it('demande de se reconnecter quand la session ne peut plus être renouvelée', async () => {
    const baseFetch = vi.fn().mockResolvedValue(expired());
    const onSessionLost = vi.fn();
    const fetcher = createFreshSessionFetch({ refresh: async () => null, onSessionLost, baseFetch });

    expect((await fetcher(REST)).status).toBe(401);
    expect(baseFetch).toHaveBeenCalledOnce();
    expect(onSessionLost).toHaveBeenCalledOnce();
  });

  it('ne touche ni aux réponses normales ni aux appels d’authentification', async () => {
    const refresh = vi.fn();
    const fetcher = createFreshSessionFetch({ refresh, onSessionLost: vi.fn(), baseFetch: vi.fn().mockResolvedValueOnce(ok()).mockResolvedValueOnce(expired()) });

    expect((await fetcher(REST)).status).toBe(200);
    expect((await fetcher('https://projet.supabase.co/auth/v1/token?grant_type=refresh_token')).status).toBe(401);
    expect(refresh).not.toHaveBeenCalled();
  });

  it('un seul renouvellement pour plusieurs requêtes refusées en même temps', async () => {
    const baseFetch = vi.fn((_input: RequestInfo | URL, init?: RequestInit) =>
      Promise.resolve(new Headers(init?.headers).get('Authorization') === 'Bearer nouveau' ? ok() : expired()));
    const refresh = vi.fn(() => new Promise<string>((resolve) => setTimeout(() => resolve('nouveau'), 5)));
    const fetcher = createFreshSessionFetch({ refresh, onSessionLost: vi.fn(), baseFetch });

    const statuses = await Promise.all([fetcher(REST), fetcher(REST), fetcher(REST)]);
    expect(statuses.map((r) => r.status)).toEqual([200, 200, 200]);
    expect(refresh).toHaveBeenCalledOnce();
  });
});
