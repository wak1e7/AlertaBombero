type SupabaseEnv = {
  VITE_AUTH_MODE?: string;
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
};

export type AuthMode = "demo" | "production";

export type SupabaseConfig = {
  url: string;
  anonKey: string;
};

export function getSupabaseConfig(env: SupabaseEnv = import.meta.env): SupabaseConfig {
  const url = env.VITE_SUPABASE_URL?.trim();
  const anonKey = env.VITE_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return { url, anonKey };
}

export function getAuthMode(env: SupabaseEnv = import.meta.env): AuthMode {
  const mode = env.VITE_AUTH_MODE?.trim() || "demo";

  if (mode === "demo" || mode === "production") {
    return mode;
  }

  throw new Error("Invalid VITE_AUTH_MODE. Use demo or production.");
}
