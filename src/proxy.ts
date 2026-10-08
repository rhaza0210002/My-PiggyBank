import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import {
  AUTH_CALLBACK_ROUTE,
  AUTH_ROUTES,
  MANIFEST_PATH,
  OPEN_ROUTES,
  REMINDERS_CRON_ROUTE,
  ROUTES,
  SERVICE_WORKER_PATH,
} from '@/constants/routes';

export async function proxy(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Les variables d'environnement Supabase sont manquantes.");
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  // getClaims() vérifie la signature du JWT et rafraîchit la session si besoin.
  const { data } = await supabase.auth.getClaims();
  const isAuthenticated = Boolean(data?.claims);
  const { pathname } = request.nextUrl;
  const isAuthPage = AUTH_ROUTES.includes(pathname);

  // Pages légales : toujours consultables, connecté ou non.
  if (OPEN_ROUTES.includes(pathname) || pathname === AUTH_CALLBACK_ROUTE) return supabaseResponse;

  // Tâche planifiée (secret), service worker et manifeste : pas de session à exiger ni de redirection.
  if (pathname === REMINDERS_CRON_ROUTE || pathname === SERVICE_WORKER_PATH || pathname === MANIFEST_PATH) return supabaseResponse;

  if (!isAuthenticated && !isAuthPage) {
    return redirectWithCookies(request, supabaseResponse, ROUTES.login);
  }

  if (isAuthenticated && (isAuthPage || pathname === '/')) {
    return redirectWithCookies(request, supabaseResponse, ROUTES.dashboard);
  }

  return supabaseResponse;
}

// Les redirections doivent reprendre les cookies de session éventuellement rafraîchis.
function redirectWithCookies(request: NextRequest, source: NextResponse, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = '';

  const redirect = NextResponse.redirect(url);
  source.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
};
