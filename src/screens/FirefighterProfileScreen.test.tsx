import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FirefighterProfileScreen } from "./FirefighterProfileScreen";

const authGetSession = vi.fn();
const profileMaybeSingle = vi.fn();

vi.mock("../lib/supabase", () => ({
  getSupabaseClient: vi.fn(() => ({
    auth: { getSession: authGetSession },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: profileMaybeSingle
        }))
      }))
    }))
  }))
}));

vi.mock("../services/authService", () => ({
  createAuthService: vi.fn(() => ({
    signOut: vi.fn()
  }))
}));

vi.mock("../services/session", () => ({
  clearLocalSessionState: vi.fn()
}));

describe("FirefighterProfileScreen", () => {
  beforeEach(() => {
    authGetSession.mockResolvedValue({ data: { session: { user: { id: "auth-firefighter" } } } });
    profileMaybeSingle.mockResolvedValue({
      data: { firefighter_code: "B-204", last_name: "Rojas", name: "Ana", phone: "+51999111222" }
    });
  });

  it("links to the company history from the firefighter profile", async () => {
    render(
      <MemoryRouter>
        <FirefighterProfileScreen navItems={[]} />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText("Ana Rojas")).toBeInTheDocument());
    expect(screen.getByRole("link", { name: /Historial de mi compania/i })).toHaveAttribute(
      "href",
      "/bombero/historial"
    );
  });
});
