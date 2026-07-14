import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createEmergencyReport } from "./reportService";

function createMockClient() {
  const upload = vi.fn().mockResolvedValue({ data: { path: "report-1/file.jpg" }, error: null });
  const single = vi.fn().mockResolvedValue({ data: { id: "evidence-1" }, error: null });
  const select = vi.fn(() => ({ single }));
  const insert = vi.fn(() => ({ select }));
  const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
  const selectExistingEvidence = vi.fn(() => ({
    eq: vi.fn(() => ({ maybeSingle }))
  }));

  return {
    client: {
      from: vi.fn(() => ({ insert, select: selectExistingEvidence })),
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
    maybeSingle,
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
      p_request_id: expect.any(String),
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

  it("uses a caller-provided request id so a retry can be idempotent", async () => {
    const { client } = createMockClient();

    await createEmergencyReport(client, {
      description: "Humo en el segundo piso",
      evidence,
      location: { addressText: "Av. Lima 116", latitude: -12.096, longitude: -77.036 },
      type: "INCENDIO"
    }, "11111111-1111-4111-8111-111111111111");

    expect(client.rpc).toHaveBeenCalledWith("create_emergency_report", expect.objectContaining({
      p_request_id: "11111111-1111-4111-8111-111111111111"
    }));
  });

  it("does not upload or insert evidence when the idempotent report already has it", async () => {
    const { client, insert, maybeSingle, upload } = createMockClient();
    maybeSingle.mockResolvedValue({ data: { id: "evidence-1" }, error: null });

    const result = await createEmergencyReport(client, {
      description: "Humo en el segundo piso",
      evidence,
      location: { addressText: "Av. Lima 116", latitude: -12.096, longitude: -77.036 },
      type: "INCENDIO"
    }, "11111111-1111-4111-8111-111111111111");

    expect(upload).not.toHaveBeenCalled();
    expect(insert).not.toHaveBeenCalled();
    expect(result).toEqual({ reportId: "report-1", status: "ENVIADO" });
  });

  it("cancels an incomplete report when evidence upload fails", async () => {
    const { client } = createMockClient();
    client.storage.from.mockReturnValue({
      upload: vi.fn().mockResolvedValue({ data: null, error: new Error("Storage unavailable") })
    });

    await expect(
      createEmergencyReport(client, {
        description: "Humo en el segundo piso",
        evidence,
        location: {
          addressText: "Av. Lima 116",
          latitude: -12.096,
          longitude: -77.036
        },
        type: "INCENDIO"
      })
    ).rejects.toThrow("Storage unavailable");

    expect(client.rpc).toHaveBeenNthCalledWith(2, "cancel_incomplete_emergency_report", {
      p_report_id: "report-1"
    });
  });

  it("keeps the evidence error when cleanup cannot reach Supabase", async () => {
    const { client } = createMockClient();
    client.storage.from.mockReturnValue({
      upload: vi.fn().mockResolvedValue({ data: null, error: new Error("Storage unavailable") })
    });
    client.rpc.mockResolvedValueOnce({
      data: { id: "report-1", status: "ENVIADO" },
      error: null
    });
    client.rpc.mockRejectedValueOnce(new Error("Cleanup unavailable"));

    await expect(
      createEmergencyReport(client, {
        description: "Humo en el segundo piso",
        evidence,
        location: {
          addressText: "Av. Lima 116",
          latitude: -12.096,
          longitude: -77.036
        },
        type: "INCENDIO"
      })
    ).rejects.toThrow("Storage unavailable");
  });
});
