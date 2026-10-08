import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Les variables d'environnement Supabase sont manquantes.");
}

// Client navigateur : la session est stockée dans des cookies pour que le proxy puisse la lire.
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
