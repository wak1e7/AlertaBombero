import { describe, expect, it, vi } from "vitest";
import { getLatestLiveLocation, upsertLiveLocation } from "./liveLocationService";

function createQueryMock(data: unknown, error: Error | null = null) {
  const query = {
    eq: vi.fn(() => query),
    limit: vi.fn(() => Promise.resolve({ data, error })),
    order: vi.fn(() => query),
    select: vi.fn(() => query)
  };
  return query;
}

describe("live location service", () => {
  it("publishes firefighter live location through RPC", async () => {
    const client = {
      rpc: vi.fn(() =>
        Promise.resolve({
          data: { latitude: -12.0464, longitude: -77.0428, report_id: "r1" },
          error: null
        })
      )
    };

    const result = await upsertLiveLocation(client, {
      latitude: -12.0464,
      longitude: -77.0428,
      reportId: "r1"
    });

    expect(client.rpc).toHaveBeenCalledWith("upsert_live_location", {
      p_latitude: -12.0464,
      p_longitude: -77.0428,
      p_report_id: "r1"
    });
    expect(result?.latitude).toBe(-12.0464);
  });

  it("rejects invalid coordinates before calling Supabase", async () => {
    const client = { rpc: vi.fn() };

    await expect(
      upsertLiveLocation(client, {
        latitude: -100,
        longitude: -77,
        reportId: "r1"
      })
    ).rejects.toThrow("Ubicacion invalida.");

    expect(client.rpc).not.toHaveBeenCalled();
  });

  it("loads the latest visible live location for a report", async () => {
    const rows = [{ latitude: -12.05, longitude: -77.04, report_id: "r1", updated_at: "2026-07-02T00:00:00Z" }];
    const query = createQueryMock(rows);
    const client = { from: vi.fn(() => query) };

    const result = await getLatestLiveLocation(client, "r1");

    expect(client.from).toHaveBeenCalledWith("live_locations");
    expect(query.eq).toHaveBeenCalledWith("report_id", "r1");
    expect(query.order).toHaveBeenCalledWith("updated_at", { ascending: false });
    expect(query.limit).toHaveBeenCalledWith(1);
    expect(result?.longitude).toBe(-77.04);
  });
});
