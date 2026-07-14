import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FirefighterReportDetailScreen } from "./FirefighterReportDetailScreen";
import { getFirefighterReportDetail } from "../services/firefighterService";

const watchPosition = vi.fn();
const clearWatch = vi.fn();

vi.mock("../components/TrackingMap", () => ({
  TrackingMap: () => <div data-testid="tracking-map" />
}));

vi.mock("../lib/supabase", () => ({
  getSupabaseClient: vi.fn(() => {
    const channel = {
      on: vi.fn(() => channel),
      subscribe: vi.fn(() => ({ topic: "firefighter-report-report-1" }))
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
    getFirefighterReportDetail: vi.fn(),
    updateFirefighterReportStatus: vi.fn()
  };
});

vi.mock("../services/liveLocationService", async () => {
  const actual = await vi.importActual<typeof import("../services/liveLocationService")>("../services/liveLocationService");
  return {
    ...actual,
    getLatestLiveLocation: vi.fn(() => Promise.resolve(null)),
    upsertLiveLocation: vi.fn(() => Promise.resolve(null))
  };
});

vi.mock("../services/statusHistoryService", async () => {
  const actual = await vi.importActual<typeof import("../services/statusHistoryService")>("../services/statusHistoryService");
  return {
    ...actual,
    listReportStatusHistory: vi.fn(() => Promise.resolve([]))
  };
});

describe("FirefighterReportDetailScreen", () => {
  beforeEach(() => {
    watchPosition.mockReset();
    clearWatch.mockReset();
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: { clearWatch, watchPosition }
    });
    vi.mocked(getFirefighterReportDetail).mockResolvedValue({
      address_text: "Av. Central 123",
      created_at: "2026-07-02T10:30:00.000Z",
      description: "Humo en vivienda",
      evidence: [],
      id: "report-1",
      latitude: -12.04,
      longitude: -77.03,
      status: "FINALIZADO",
      type: "INCENDIO"
    });
  });

  it("returns to firefighter history when opened from the history list", async () => {
    render(
      <MemoryRouter initialEntries={["/bombero/reportes/report-1?from=historial"]}>
        <Routes>
          <Route path="/bombero/reportes/:id" element={<FirefighterReportDetailScreen />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByRole("status")).toHaveTextContent("Cargando emergencia...");
    expect(await screen.findByRole("heading", { name: "Emergencia asignada" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Volver al historial" })).toHaveAttribute("href", "/bombero/historial");
  });

  it("starts sharing location automatically when the firefighter is en route", async () => {
    vi.mocked(getFirefighterReportDetail).mockResolvedValueOnce({
      address_text: "Av. Central 123",
      created_at: "2026-07-02T10:30:00.000Z",
      description: "Humo en vivienda",
      evidence: [],
      id: "report-1",
      latitude: -12.04,
      longitude: -77.03,
      status: "EN_CAMINO",
      type: "INCENDIO"
    });

    render(
      <MemoryRouter initialEntries={["/bombero/reportes/report-1"]}>
        <Routes>
          <Route path="/bombero/reportes/:id" element={<FirefighterReportDetailScreen />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText("Ubicacion en vivo")).toBeInTheDocument();
    await waitFor(() => expect(watchPosition).toHaveBeenCalledWith(expect.any(Function), expect.any(Function), {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 10000
    }));
    expect(screen.queryByRole("button", { name: /iniciar ubicacion|activar ubicacion/i })).not.toBeInTheDocument();
  });
});
