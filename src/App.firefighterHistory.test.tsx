import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";
import { listCompanyFirefighterHistory } from "./services/firefighterService";

vi.mock("./services/session", async () => {
  const actual = await vi.importActual<typeof import("./services/session")>("./services/session");
  return {
    ...actual,
    getActiveSessionId: vi.fn(() => "active-session")
  };
});

vi.mock("./lib/supabase", () => ({
  getSupabaseClient: vi.fn(() => {
    const channel = {
      on: vi.fn(() => channel),
      subscribe: vi.fn(() => ({ topic: "firefighter-history" }))
    };

    return {
      auth: {
        getSession: vi.fn(() => Promise.resolve({ data: { session: { user: { id: "auth-firefighter" } } } }))
      },
      channel: vi.fn(() => channel),
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(() =>
              Promise.resolve({
                data: { active_session_id: "active-session", phone_verified: true, role: "firefighter" }
              })
            )
          }))
        }))
      })),
      removeChannel: vi.fn()
    };
  })
}));

vi.mock("./services/firefighterService", async () => {
  const actual = await vi.importActual<typeof import("./services/firefighterService")>("./services/firefighterService");
  return {
    ...actual,
    listCompanyFirefighterHistory: vi.fn(() => Promise.resolve([]))
  };
});

describe("App firefighter history route", () => {
  beforeEach(() => {
    window.history.pushState({}, "", "/bombero/historial");
    vi.mocked(listCompanyFirefighterHistory).mockClear();
  });

  it("protects and renders the firefighter company history route", async () => {
    render(<App />);

    expect(await screen.findByRole("heading", { name: "Reportes finalizados" })).toBeInTheDocument();
    await waitFor(() => expect(listCompanyFirefighterHistory).toHaveBeenCalled());
  });
});
