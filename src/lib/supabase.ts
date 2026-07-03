import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  // Keep the app from crashing during static preview, but show a clear error in the UI.
  console.warn('Supabase environment variables are missing.');
}

export const supabase = createClient(
  supabaseUrl ?? 'https://missing-supabase-url.supabase.co',
  supabaseAnonKey ?? 'missing-anon-key'
);

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
