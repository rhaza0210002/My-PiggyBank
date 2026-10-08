import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';
import { ROUTES } from '@/constants/routes';
import { safeRedirectPath } from '@/utils/safeRedirect';

/**
 * Retour des liens envoyés par e-mail (confirmation d'inscription, mot de passe oublié) et de Google.
 * Échange le code à usage unique contre une session (cookies), puis redirige vers `next`.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = safeRedirectPath(searchParams.get('next'), ROUTES.dashboard);
  const failure = NextResponse.redirect(`${origin}${ROUTES.login}?erreur=lien`);

  if (!code) return failure;

  const cookieStore = await cookies();
  const response = NextResponse.redirect(`${origin}${next}`);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) =>
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options)),
      },
    },
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  return error ? failure : response;
}
