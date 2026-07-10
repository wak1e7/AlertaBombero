import { buildReportStoragePath, validateReportDraft, type ReportDraft } from "../domain/report";
import type { EmergencyStatus } from "../domain/emergencyStatus";

type SupabaseReportClient = {
  from: (table: string) => {
    insert: (payload: Record<string, unknown>) => {
      select: (columns?: string) => {
        single: () => PromiseLike<{ data: unknown; error: Error | null }>;
      };
    };
  };
  rpc: (
    fn: string,
    params: Record<string, unknown>
  ) => PromiseLike<{ data: { id: string; status: EmergencyStatus } | null; error: Error | null }>;
  storage: {
    from: (bucket: string) => {
      upload: (
        path: string,
        file: File,
        options: { contentType: string; upsert: boolean }
      ) => PromiseLike<{ data: unknown; error: Error | null }>;
    };
  };
};

export async function createEmergencyReport(client: SupabaseReportClient, draft: ReportDraft) {
  const validation = validateReportDraft(draft);
  if (!validation.ok || !(draft.evidence instanceof File) || !draft.location) {
    throw new Error("Completa el reporte antes de enviarlo.");
  }

  const { data: report, error: reportError } = await client.rpc("create_emergency_report", {
    p_address_text: draft.location.addressText,
    p_description: draft.description.trim(),
    p_latitude: draft.location.latitude,
    p_longitude: draft.location.longitude,
    p_type: draft.type
  });

  if (reportError || !report) {
    throw reportError ?? new Error("No se pudo crear el reporte.");
  }

  try {
    const filePath = buildReportStoragePath(report.id, draft.evidence);
    const { error: uploadError } = await client.storage.from("report-evidence").upload(filePath, draft.evidence, {
      contentType: draft.evidence.type,
      upsert: false
    });

    if (uploadError) {
      throw uploadError;
    }

    const { error: evidenceError } = await client
      .from("report_evidence")
      .insert({
        file_name: draft.evidence.name,
        file_size: draft.evidence.size,
        file_type: draft.evidence.type.startsWith("video/") ? "video" : "image",
        file_url: filePath,
        report_id: report.id
      })
      .select("id")
      .single();

    if (evidenceError) {
      throw evidenceError;
    }

    return { reportId: report.id, status: report.status };
  } catch (error) {
    try {
      await client.rpc("cancel_incomplete_emergency_report", { p_report_id: report.id });
    } catch {
      // Preserve the original evidence failure; cleanup can be retried administratively.
    }
    throw error;
  }
}
