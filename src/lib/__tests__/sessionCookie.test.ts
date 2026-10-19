import { describe, expect, it } from 'vitest';
import { SESSION_MAX_AGE_SECONDS, withSessionMaxAge } from '@/lib/sessionCookie';

describe('withSessionMaxAge', () => {
  it('ramène les 400 jours imposés par Supabase à 24 h', () => {
    expect(SESSION_MAX_AGE_SECONDS).toBe(86_400);
    expect(withSessionMaxAge({ path: '/', sameSite: 'lax', maxAge: 400 * 24 * 60 * 60 })).toEqual({
      path: '/',
      sameSite: 'lax',
      maxAge: 86_400,
    });
  });

  it('laisse passer l’effacement d’un cookie (maxAge 0)', () => {
    expect(withSessionMaxAge({ path: '/', maxAge: 0 })).toEqual({ path: '/', maxAge: 0 });
  });
});
