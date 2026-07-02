import { act, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CitizenTrackingScreen } from "./CitizenTrackingScreen";

type ChangeHandler = (payload: { new: unknown }) => void;

const reportUpdateHandlers: ChangeHandler[] = [];

vi.mock("../components/TrackingMap", () => ({
  TrackingMap: () => <div data-testid="tracking-map" />
}));

vi.mock("../lib/supabase", () => ({
  getSupabaseClient: vi.fn(() => {
    const channel = {
      on: vi.fn((_eventType: string, filter: Record<string, unknown>, handler: ChangeHandler) => {
        if (filter.table === "emergency_reports" && filter.event === "UPDATE") {
          reportUpdateHandlers.push(handler);
        }
        return channel;
      }),
      subscribe: vi.fn(() => ({ topic: "report-report-1" }))
    };

    return {
      channel: vi.fn(() => channel),
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(() =>
              Promise.resolve({
                data: {
                  address_text: "Av. Central 123",
                  created_at: "2026-07-02T10:30:00.000Z",
                  id: "report-1",
                  latitude: -12.04,
                  longitude: -77.03,
                  status: "RECIBIDO",
                  type: "INCENDIO"
                },
                error: null
              })
            )
          }))
        }))
      })),
      removeChannel: vi.fn()
    };
  })
}));

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

describe("CitizenTrackingScreen", () => {
  beforeEach(() => {
    reportUpdateHandlers.length = 0;
  });

  it("shows an in-app notification when the report status changes", async () => {
    render(
      <MemoryRouter initialEntries={["/ciudadano/seguimiento/report-1"]}>
        <Routes>
          <Route path="/ciudadano/seguimiento/:id" element={<CitizenTrackingScreen />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText("INCENDIO")).toBeInTheDocument();
    await waitFor(() => expect(reportUpdateHandlers).toHaveLength(1));

    act(() => {
      reportUpdateHandlers[0]({
        new: {
          address_text: "Av. Central 123",
          created_at: "2026-07-02T10:30:00.000Z",
          id: "report-1",
          latitude: -12.04,
          longitude: -77.03,
          status: "EN_CAMINO",
          type: "INCENDIO"
        }
      });
    });

    expect(await screen.findByText("Estado actualizado")).toBeInTheDocument();
    expect(screen.getAllByText("Bombero en camino").length).toBeGreaterThanOrEqual(2);
  });
});
