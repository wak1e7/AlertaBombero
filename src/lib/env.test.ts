import { describe, expect, it } from "vitest";
import { getSupabaseConfig } from "./env";

describe("getSupabaseConfig", () => {
  it("returns configured Supabase URL and anon key", () => {
    const config = getSupabaseConfig({
      VITE_SUPABASE_URL: "https://wgmutedunlhsevbdovvm.supabase.co",
      VITE_SUPABASE_ANON_KEY: "public-anon-key"
    });

    expect(config).toEqual({
      url: "https://wgmutedunlhsevbdovvm.supabase.co",
      anonKey: "public-anon-key"
    });
  });

  it("throws a helpful error when Supabase env vars are missing", () => {
    expect(() => getSupabaseConfig({})).toThrow(
      "Missing Supabase environment variables"
    );
  });
});
