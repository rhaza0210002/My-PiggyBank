import { createBrowserClient } from '@supabase/ssr';
import { endDemo } from '@/services/demoStore';
import { invalidateCache } from '@/utils/memoryCache';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Les variables d'environnement Supabase sont manquantes.");
}

// Client navigateur : la session est stockée dans des cookies pour que le proxy puisse la lire.
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

// Une autre session ne doit jamais voir les données gardées en mémoire par la précédente.
supabase.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_OUT') {
    invalidateCache();
    endDemo();
  }
});
