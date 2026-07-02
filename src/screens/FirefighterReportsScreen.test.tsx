import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FirefighterReportsScreen } from "./FirefighterReportsScreen";
import { listActiveFirefighterReports } from "../services/firefighterService";

type ChangeHandler = (payload: { new: unknown }) => void;

const realtimeHandlers: ChangeHandler[] = [];

vi.mock("../lib/supabase", () => ({
  getSupabaseClient: vi.fn(() => {
    const channel = {
      on: vi.fn((_eventType: string, filter: Record<string, unknown>, handler: ChangeHandler) => {
        if (filter.event === "INSERT") realtimeHandlers.push(handler);
        return channel;
      }),
      subscribe: vi.fn(() => ({ topic: "firefighter-active-reports" }))
    };

    return {
      channel: vi.fn(() => channel),
      removeChannel: vi.fn()
    };
  })
}));

vi.mock("../services/firefighterService", async () => {
  const actual = await vi.importActual<typeof import("../services/firefighterService")>("../services/firefighterService");
  return {
    ...actual,
    listActiveFirefighterReports: vi.fn()
  };
});

describe("FirefighterReportsScreen", () => {
  beforeEach(() => {
    realtimeHandlers.length = 0;
    vi.mocked(listActiveFirefighterReports).mockResolvedValue([]);
  });

  it("shows an in-app notification when a new assigned report arrives through Realtime", async () => {
    render(
      <MemoryRouter>
        <FirefighterReportsScreen navItems={[]} />
      </MemoryRouter>
    );

    await waitFor(() => expect(realtimeHandlers).toHaveLength(1));

    realtimeHandlers[0]({
      new: {
        address_text: "Av. Central 123",
        id: "report-1",
        status: "ENVIADO",
        type: "INCENDIO"
      }
    });

    expect(await screen.findByText("Nuevo reporte asignado")).toBeInTheDocument();
    expect(screen.getByText("INCENDIO en Av. Central 123")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Ver reporte/i })).toHaveAttribute(
      "href",
      "/bombero/reportes/report-1"
    );
  });
});
