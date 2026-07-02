import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createEmergencyReport } from "./reportService";

function createMockClient() {
  const upload = vi.fn().mockResolvedValue({ data: { path: "report-1/file.jpg" }, error: null });
  const single = vi.fn().mockResolvedValue({ data: { id: "evidence-1" }, error: null });
  const select = vi.fn(() => ({ single }));
  const insert = vi.fn(() => ({ select }));

  return {
    client: {
      from: vi.fn(() => ({ insert })),
      rpc: vi.fn().mockResolvedValue({
        data: {
          id: "report-1",
          status: "ENVIADO"
        },
        error: null
      }),
      storage: {
        from: vi.fn(() => ({ upload }))
      }
    },
    insert,
    upload
  };
}

const evidence = new File(["abc"], "incendio.jpg", { type: "image/jpeg" });

describe("report service", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(1700000000000);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("creates the report through RPC before uploading evidence metadata", async () => {
    const { client, insert, upload } = createMockClient();

    const result = await createEmergencyReport(client, {
      description: "Humo en el segundo piso",
      evidence,
      location: {
        addressText: "Av. Lima 116",
        latitude: -12.096,
        longitude: -77.036
      },
      type: "INCENDIO"
    });

    expect(client.rpc).toHaveBeenCalledWith("create_emergency_report", {
      p_address_text: "Av. Lima 116",
      p_description: "Humo en el segundo piso",
      p_latitude: -12.096,
      p_longitude: -77.036,
      p_type: "INCENDIO"
    });
    expect(upload).toHaveBeenCalledWith("report-1/1700000000000-incendio.jpg", evidence, {
      contentType: "image/jpeg",
      upsert: false
    });
    expect(insert).toHaveBeenCalledWith({
      file_name: "incendio.jpg",
      file_size: evidence.size,
      file_type: "image",
      file_url: "report-1/1700000000000-incendio.jpg",
      report_id: "report-1"
    });
    expect(result).toEqual({ reportId: "report-1", status: "ENVIADO" });
  });

  it("does not call Supabase when the draft is incomplete", async () => {
    const { client } = createMockClient();

    await expect(
      createEmergencyReport(client, {
        description: "",
        evidence: null,
        location: null,
        type: ""
      })
    ).rejects.toThrow("Completa el reporte antes de enviarlo.");

    expect(client.rpc).not.toHaveBeenCalled();
  });
});
