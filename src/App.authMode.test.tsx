import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { savePendingAuth } from "./services/session";

describe("App auth mode", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
    sessionStorage.clear();
  });

  it("hides demo credentials on login screens in production auth mode", async () => {
    vi.stubEnv("VITE_AUTH_MODE", "production");
    window.history.pushState({}, "", "/ciudadano/login");
    const { App } = await import("./App");

    render(<App />);

    expect(screen.getByRole("heading", { name: "Iniciar sesion" })).toBeInTheDocument();
    expect(screen.queryByText(/Demo:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/OTP:/i)).not.toBeInTheDocument();
  });

  it("hides the simulated OTP value on OTP screens in production auth mode", async () => {
    vi.stubEnv("VITE_AUTH_MODE", "production");
    savePendingAuth({
      expiresAt: Date.now() + 60_000,
      profileId: "profile-id",
      purpose: "citizen_new_device",
      role: "citizen",
      userIdentifier: "+51999888777",
      welcomePath: "/ciudadano/bienvenida"
    });
    window.history.pushState({}, "", "/ciudadano/otp");
    const { App } = await import("./App");

    render(<App />);

    expect(screen.getByRole("heading", { name: "Verificar identidad" })).toBeInTheDocument();
    expect(screen.queryByText(/OTP simulado para demo/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/116116/i)).not.toBeInTheDocument();
  });
});
