import type { EmergencyStatus } from "../domain/emergencyStatus";

export type FirefighterReportSummary = {
  address_text: string | null;
  created_at: string;
  description: string | null;
  id: string;
  latitude: number;
  longitude: number;
  status: EmergencyStatus;
  type: string;
};

export type FirefighterEvidence = {
  file_name: string;
  file_url: string;
  file_type: string;
  id: string;
  signedUrl: string;
};

export type FirefighterReportDetail = FirefighterReportSummary & {
  evidence: FirefighterEvidence[];
};

type QueryBuilder = {
  eq: (column: string, value: unknown) => QueryBuilder;
  in: (column: string, values: unknown[]) => QueryBuilder;
  maybeSingle: () => PromiseLike<{ data: unknown; error: Error | null }>;
  order: (column: string, options?: Record<string, unknown>) => PromiseLike<{ data: unknown; error: Error | null }>;
  select: (columns?: string) => QueryBuilder;
};

export type FirefighterClient = {
  from?: (table: string) => {
    select: (columns?: string) => QueryBuilder;
  };
  rpc?: (
    fn: string,
    params: Record<string, unknown>
  ) => PromiseLike<{ data: { id: string; status: EmergencyStatus } | null; error: Error | null }>;
  storage?: {
    from: (bucket: string) => {
      createSignedUrl: (
        path: string,
        expiresIn: number
      ) => PromiseLike<{ data: { signedUrl: string } | null; error: Error | null }>;
    };
  };
};

const activeStatuses: EmergencyStatus[] = ["ENVIADO", "RECIBIDO", "EN_CAMINO", "ATENDIENDO"];

const reportColumns = "id,type,status,address_text,description,latitude,longitude,created_at";

export async function listActiveFirefighterReports(client: FirefighterClient): Promise<FirefighterReportSummary[]> {
  if (!client.from) throw new Error("Cliente Supabase incompleto.");

  const { data, error } = await client
    .from("emergency_reports")
    .select(reportColumns)
    .in("status", activeStatuses)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as FirefighterReportSummary[];
}

export async function listCompanyFirefighterHistory(client: FirefighterClient): Promise<FirefighterReportSummary[]> {
  if (!client.from) throw new Error("Cliente Supabase incompleto.");

  const { data, error } = await client
    .from("emergency_reports")
    .select(reportColumns)
    .eq("status", "FINALIZADO")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as FirefighterReportSummary[];
}

export async function getFirefighterReportDetail(
  client: FirefighterClient,
  reportId: string
): Promise<FirefighterReportDetail> {
  if (!client.from || !client.storage) throw new Error("Cliente Supabase incompleto.");

  const { data: report, error: reportError } = await client
    .from("emergency_reports")
    .select(reportColumns)
    .eq("id", reportId)
    .maybeSingle();

  if (reportError || !report) {
    throw reportError ?? new Error("No se encontro el reporte.");
  }

  const { data: evidenceRows, error: evidenceError } = await client
    .from("report_evidence")
    .select("id,file_name,file_url,file_type")
    .eq("report_id", reportId)
    .order("created_at", { ascending: true });

  if (evidenceError) throw evidenceError;

  const uniqueEvidence = Array.from(
    new Map(
      ((evidenceRows ?? []) as Array<Omit<FirefighterEvidence, "signedUrl">>).map((item) => [item.file_name, item])
    ).values()
  );

  const evidence = await Promise.all(
    uniqueEvidence.map(async (item) => {
      const { data, error } = await client.storage!.from("report-evidence").createSignedUrl(item.file_url, 300);
      if (error || !data) throw error ?? new Error("No se pudo cargar la evidencia.");
      return { ...item, signedUrl: data.signedUrl };
    })
  );

  return { ...(report as FirefighterReportSummary), evidence };
}

export async function updateFirefighterReportStatus(
  client: FirefighterClient,
  reportId: string,
  status: Exclude<EmergencyStatus, "ENVIADO" | "SIN_COMPANIA_DISPONIBLE">,
  observation = ""
) {
  if (!client.rpc) throw new Error("Cliente Supabase incompleto.");

  const { data, error } = await client.rpc!("set_report_status", {
    observation,
    target_report_id: reportId,
    target_status: status
  });

  if (error || !data) throw error ?? new Error("No se pudo actualizar el estado.");
  return data;
}
