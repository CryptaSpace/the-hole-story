import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

let _supabase = null;

export function getSupabaseClient() {
  if (_supabase) return _supabase;

  if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
    throw new Error("Supabase config missing");
  }

  _supabase = createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return _supabase;
}
