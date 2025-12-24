export function getConfig() {
  if (!window.__CONFIG__ || !window.__CONFIG__.SUPABASE_URL || !window.__CONFIG__.SUPABASE_ANON_KEY) {
    throw new Error("Missing Supabase config. Edit /site/public/config.js and set SUPABASE_URL and SUPABASE_ANON_KEY.");
  }
  return window.__CONFIG__;
}

export async function getSupabaseClient() {
  const cfg = getConfig();

  // Load supabase-js from CDN if not already available
  if (!window.supabase || !window.supabase.createClient) {
    await new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
      s.onload = resolve;
      s.onerror = () => reject(new Error("Failed to load supabase-js CDN."));
      document.head.appendChild(s);
    });
  }

  return window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
}
