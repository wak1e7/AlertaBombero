import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "./env";

let browserClient: ReturnType<typeof createBrowserSupabaseClient> | null = null;

export function createBrowserSupabaseClient() {
  const { url, anonKey } = getSupabaseConfig();

  return createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });
}

export function getSupabaseClient() {
  browserClient ??= createBrowserSupabaseClient();
  return browserClient;
}
