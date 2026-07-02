import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FirefighterHistoryScreen } from "./FirefighterHistoryScreen";
import { listCompanyFirefighterHistory } from "../services/firefighterService";

vi.mock("../lib/supabase", () => ({
  getSupabaseClient: vi.fn(() => {
    const channel = {
      on: vi.fn(() => channel),
      subscribe: vi.fn(() => ({ topic: "firefighter-history" }))
    };

    return {
      channel: vi.fn(() => channel),
      removeChannel: vi.fn()
    };
  })
}));

vi.mock("../services/firefighterService", () => ({
  listCompanyFirefighterHistory: vi.fn()
}));

describe("FirefighterHistoryScreen", () => {
  beforeEach(() => {
    vi.mocked(listCompanyFirefighterHistory).mockReset();
  });

  it("renders finalized company reports and links to their detail", async () => {
    vi.mocked(listCompanyFirefighterHistory).mockResolvedValue([
      {
        address_text: "Av. Central 123",
        created_at: "2026-07-02T10:30:00.000Z",
        description: "Humo en vivienda",
        id: "report-1",
        latitude: -12.04,
        longitude: -77.03,
        status: "FINALIZADO",
        type: "INCENDIO"
      }
    ]);

    render(
      <MemoryRouter>
        <FirefighterHistoryScreen navItems={[]} />
      </MemoryRouter>
    );

    expect(screen.getByText("Cargando historial...")).toBeInTheDocument();
    expect(await screen.findByText("INCENDIO")).toBeInTheDocument();
    expect(screen.getByText("Av. Central 123")).toBeInTheDocument();
    expect(screen.getByText("Emergencia finalizada")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /INCENDIO/i })).toHaveAttribute(
      "href",
      "/bombero/reportes/report-1?from=historial"
    );
  });

  it("renders an empty state when the company has no finalized reports", async () => {
    vi.mocked(listCompanyFirefighterHistory).mockResolvedValue([]);

    render(
      <MemoryRouter>
        <FirefighterHistoryScreen navItems={[]} />
      </MemoryRouter>
    );

    expect(await screen.findByText("Aun no hay reportes finalizados en tu compania.")).toBeInTheDocument();
  });
});
