import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FirefighterReportDetailScreen } from "./FirefighterReportDetailScreen";
import { getFirefighterReportDetail } from "../services/firefighterService";

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
    getLatestLiveLocation: vi.fn(() => Promise.resolve(null))
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

    expect(await screen.findByRole("heading", { name: "Emergencia asignada" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Volver al historial" })).toHaveAttribute("href", "/bombero/historial");
  });
});
