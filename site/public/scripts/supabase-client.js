import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
  throw new Error(
    "Supabase config missing from window.SUPABASE_URL or window.SUPABASE_ANON_KEY"
  );
}

const _supabase = createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export function getSupabaseClient() {
  return _supabase;
}
