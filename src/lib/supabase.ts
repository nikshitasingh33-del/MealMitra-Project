// Supabase client singleton. Reads env vars injected by Vite at build time.
// Vite statically replaces import.meta.env.VITE_* at transform time, so these
// values are baked into the served JS. If the env vars are somehow missing
// (e.g. dev server cache not yet invalidated), we expose a flag so the UI can
// show a clear configuration error instead of silently failing every request.

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!supabaseConfigured) {
  // eslint-disable-next-line no-console
  console.error(
    "MealMitra: Supabase env vars (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) are not loaded. If the dev server was running before .env was set, restart it or save any source file to trigger a reload."
  );
}

// When configured, use the real values. When not, still create a client (against
// a dummy local URL) so imports don't crash — calls will fail fast with a clear
// TypeError that the UI can catch and display.
export const supabase = createClient(
  supabaseConfigured ? supabaseUrl : "https://0.0.0.0",
  supabaseConfigured ? supabaseAnonKey : "dummy",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
