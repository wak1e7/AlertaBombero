import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: {
        getCurrentPosition: (success: PositionCallback) =>
          success({ coords: { latitude: -12.0464, longitude: -77.0428 } } as GeolocationPosition)
      }
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
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

  it("shows the approximate distance to each active report", async () => {
    vi.mocked(listActiveFirefighterReports).mockResolvedValue([
      {
        address_text: "Av. Central 123",
        created_at: "2026-07-10T12:00:00.000Z",
        description: null,
        id: "report-1",
        latitude: -12.0564,
        longitude: -77.0428,
        status: "ENVIADO",
        type: "INCENDIO"
      }
    ]);

    render(
      <MemoryRouter>
        <FirefighterReportsScreen navItems={[]} />
      </MemoryRouter>
    );

    expect(await screen.findByText("1.1 km aprox.")).toBeInTheDocument();
  });

  it("keeps active reports visible when device location is unavailable", async () => {
    Object.defineProperty(navigator, "geolocation", { configurable: true, value: undefined });
    vi.mocked(listActiveFirefighterReports).mockResolvedValue([
      {
        address_text: "Av. Central 123",
        created_at: "2026-07-10T12:00:00.000Z",
        description: null,
        id: "report-1",
        latitude: -12.0564,
        longitude: -77.0428,
        status: "ENVIADO",
        type: "INCENDIO"
      }
    ]);

    render(
      <MemoryRouter>
        <FirefighterReportsScreen navItems={[]} />
      </MemoryRouter>
    );

    expect(await screen.findByText("INCENDIO")).toBeInTheDocument();
    expect(screen.getByText("Distancia no disponible")).toBeInTheDocument();
  });
});
