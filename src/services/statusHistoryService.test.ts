import { describe, expect, it, vi } from "vitest";
import { listReportStatusHistory } from "./statusHistoryService";

function createQueryMock(data: unknown, error: Error | null = null) {
  const query = {
    eq: vi.fn(() => query),
    order: vi.fn(() => Promise.resolve({ data, error })),
    select: vi.fn(() => query)
  };
  return query;
}

describe("status history service", () => {
  it("loads report status history in chronological order", async () => {
    const rows = [
      {
        created_at: "2026-07-02T10:00:00Z",
        id: "h1",
        new_status: "ENVIADO",
        observation: null,
        old_status: null
      }
    ];
    const query = createQueryMock(rows);
    const client = { from: vi.fn(() => query) };

    const result = await listReportStatusHistory(client, "r1");

    expect(client.from).toHaveBeenCalledWith("report_status_history");
    expect(query.select).toHaveBeenCalledWith("id,old_status,new_status,observation,created_at");
    expect(query.eq).toHaveBeenCalledWith("report_id", "r1");
    expect(query.order).toHaveBeenCalledWith("created_at", { ascending: true });
    expect(result).toEqual(rows);
  });

  it("throws query errors", async () => {
    const client = { from: vi.fn(() => createQueryMock(null, new Error("RLS denied"))) };

    await expect(listReportStatusHistory(client, "r1")).rejects.toThrow("RLS denied");
  });
});
