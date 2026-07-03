import { describe, expect, it } from "vitest";
import { getAuthMode, getSupabaseConfig } from "./env";

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

describe("getAuthMode", () => {
  it("uses demo auth mode by default for MVP demos", () => {
    expect(getAuthMode({})).toBe("demo");
  });

  it("accepts explicit demo and production auth modes", () => {
    expect(getAuthMode({ VITE_AUTH_MODE: "demo" })).toBe("demo");
    expect(getAuthMode({ VITE_AUTH_MODE: "production" })).toBe("production");
  });

  it("rejects unknown auth modes", () => {
    expect(() => getAuthMode({ VITE_AUTH_MODE: "sms" })).toThrow(
      "Invalid VITE_AUTH_MODE. Use demo or production."
    );
  });
});
