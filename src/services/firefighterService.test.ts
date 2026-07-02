import { describe, expect, it, vi } from "vitest";
import {
  getFirefighterReportDetail,
  listActiveFirefighterReports,
  updateFirefighterReportStatus
} from "./firefighterService";

function createQueryMock(data: unknown, error: Error | null = null) {
  const query = {
    eq: vi.fn(() => query),
    in: vi.fn(() => query),
    maybeSingle: vi.fn(() => Promise.resolve({ data, error })),
    order: vi.fn(() => Promise.resolve({ data, error })),
    select: vi.fn(() => query)
  };
  return query;
}

describe("firefighter service", () => {
  it("lists only active reports visible to the firefighter RLS scope", async () => {
    const reports = [
      { id: "r1", status: "ENVIADO", type: "INCENDIO" },
      { id: "r2", status: "EN_CAMINO", type: "RESCATE" }
    ];
    const query = createQueryMock(reports);
    const client = { from: vi.fn(() => query) };

    const result = await listActiveFirefighterReports(client);

    expect(client.from).toHaveBeenCalledWith("emergency_reports");
    expect(query.in).toHaveBeenCalledWith("status", ["ENVIADO", "RECIBIDO", "EN_CAMINO", "ATENDIENDO"]);
    expect(query.order).toHaveBeenCalledWith("created_at", { ascending: false });
    expect(result).toEqual(reports);
  });

  it("loads report detail and evidence signed urls", async () => {
    const reportQuery = createQueryMock({ id: "r1", status: "ENVIADO", type: "INCENDIO" });
    const evidenceQuery = createQueryMock([{ file_url: "r1/foto.jpg", file_type: "image", id: "e1" }]);
    const createSignedUrl = vi.fn(() => Promise.resolve({ data: { signedUrl: "https://signed.test/foto.jpg" }, error: null }));
    const client = {
      from: vi.fn((table: string) => (table === "emergency_reports" ? reportQuery : evidenceQuery)),
      storage: { from: vi.fn(() => ({ createSignedUrl })) }
    };

    const result = await getFirefighterReportDetail(client, "r1");

    expect(reportQuery.eq).toHaveBeenCalledWith("id", "r1");
    expect(evidenceQuery.eq).toHaveBeenCalledWith("report_id", "r1");
    expect(createSignedUrl).toHaveBeenCalledWith("r1/foto.jpg", 300);
    expect(result.evidence[0].signedUrl).toBe("https://signed.test/foto.jpg");
  });

  it("changes status through the server RPC", async () => {
    const client = {
      rpc: vi.fn(() => Promise.resolve({ data: { id: "r1", status: "RECIBIDO" as const }, error: null }))
    };

    const result = await updateFirefighterReportStatus(client, "r1", "RECIBIDO", "Confirmado por radio");

    expect(client.rpc).toHaveBeenCalledWith("set_report_status", {
      observation: "Confirmado por radio",
      target_report_id: "r1",
      target_status: "RECIBIDO"
    });
    expect(result.status).toBe("RECIBIDO");
  });
});
