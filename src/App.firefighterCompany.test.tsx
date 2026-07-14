import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { FirefighterHome } from "./App";

const maybeSingle = vi.fn((() => Promise.resolve({ data: null })) as () => Promise<{ data: unknown }>);

vi.mock("./lib/supabase", () => ({
  getSupabaseClient: vi.fn(() => ({
    auth: { getSession: vi.fn(() => Promise.resolve({ data: { session: { user: { id: "auth-firefighter" } } } })) },
    from: vi.fn(() => ({
      select: vi.fn((columns: string) => {
        maybeSingle.mockResolvedValue({
          data: columns.includes("fire_companies")
            ? { fire_companies: { name: "B-88 Salvadora Lambayeque" } }
            : { last_name: "Lambayeque 88 001", name: "Bombero" }
        });
        return { eq: vi.fn(() => ({ maybeSingle })) };
      })
    }))
  }))
}));

describe("FirefighterHome", () => {
  it("shows the company assigned to the signed-in firefighter", async () => {
    render(
      <MemoryRouter>
        <FirefighterHome />
      </MemoryRouter>
    );

    expect(await screen.findByText("B-88 Salvadora Lambayeque")).toBeInTheDocument();
    expect(screen.queryByText("Cuerpo de Bomberos - Chiclayo")).not.toBeInTheDocument();
  });
});
