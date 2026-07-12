import { describe, expect, it, vi } from "vitest";
import { createAuthService } from "./authService";

function createClient() {
  return {
    auth: {
      signUp: vi.fn().mockResolvedValue({ data: { user: { id: "auth-citizen" } }, error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: { user: { id: "auth-user" } }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null })
    },
    rpc: vi.fn(() => {
      return Promise.resolve({
        data: { id: "profile-id", role: "citizen", active: true },
        error: null
      });
    }),
    functions: {
      invoke: vi.fn((name: string) => {
        if (name === "register-citizen") {
          return Promise.resolve({
            data: {
              email: "c-51999888777@ciudadano.alertabombero.app",
              phone: "+51999888777",
              profileId: "profile-id",
              role: "citizen"
            },
            error: null
          });
        }

        return Promise.resolve({
          data: {
            email: "b-204@bombero.alertabombero.app",
            profileId: "firefighter-profile",
            role: "firefighter"
          },
          error: null
        });
      })
    },
    from: vi.fn((table: string) => ({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: table === "profiles" ? { id: "profile-id", role: "citizen" } : null,
            error: null
          })
        })
      }),
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: {
              id: "firefighter-profile",
              role: "firefighter",
              phone: "+51900111222",
              active: true
            },
            error: null
          })
        })
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null })
      })
    }))
  };
}

describe("authService", () => {
  it("registers a citizen using a technical Supabase auth email and creates a profile", async () => {
    const client = createClient();
    const service = createAuthService(client);

    const result = await service.registerCitizen({
      name: "Juan",
      lastName: "Perez",
      phone: "999888777",
      dni: "12345678",
      password: "seguro123"
    });

    expect(client.functions.invoke).toHaveBeenCalledWith("register-citizen", {
      body: {
        name: "Juan",
        lastName: "Perez",
        phone: "+51999888777",
        dni: "12345678",
        password: "seguro123"
      }
    });
    expect(client.auth.signInWithPassword).toHaveBeenCalledWith({
      email: "c-51999888777@ciudadano.alertabombero.app",
      password: "seguro123"
    });
    expect(result.nextStep).toBe("otp");
    expect(result.otp.userIdentifier).toBe("+51999888777");
  });

  it("starts firefighter login by checking the preloaded profile and signing in", async () => {
    const client = createClient();
    const service = createAuthService(client);

    const result = await service.loginFirefighter({
      firefighterCode: "A27001",
      password: "bombero123"
    });

    expect(client.auth.signInWithPassword).toHaveBeenCalledWith({
      email: "a27001@bombero.alertabombero.app",
      password: "bombero123"
    });
    expect(client.from).toHaveBeenCalledWith("profiles");
    expect(client.rpc).not.toHaveBeenCalledWith("link_firefighter_profile", expect.anything());
    expect(result.nextStep).toBe("otp");
    expect(result.otp?.purpose).toBe("firefighter_login");
  });

  it("does not allow firefighter self-provisioning after a failed login", async () => {
    const client = createClient();
    client.auth.signInWithPassword.mockResolvedValueOnce({
      data: null,
      error: new Error("Invalid login credentials")
    });
    const service = createAuthService(client);

    await expect(
      service.loginFirefighter({
        firefighterCode: "A27001",
        password: "bombero123"
      })
    ).rejects.toThrow("Invalid login credentials");
    expect(client.functions.invoke).not.toHaveBeenCalledWith("provision-firefighter", expect.anything());
  });

  it("blocks simulated OTP when production mode is selected", async () => {
    const client = createClient();
    const service = createAuthService(client, { authMode: "production" });

    await expect(
      service.loginCitizen({
        phone: "+51999888777",
        password: "seguro123"
      })
    ).rejects.toThrow("Autenticacion productiva aun no esta configurada.");
  });

  it("does not complete demo OTP in production mode", async () => {
    const client = createClient();
    const service = createAuthService(client, { authMode: "production" });

    await expect(service.markPhoneVerified("profile-id", "session-id")).rejects.toThrow(
      "Autenticacion productiva aun no esta configurada."
    );
    expect(client.rpc).not.toHaveBeenCalledWith("complete_demo_otp", expect.anything());
  });
});
