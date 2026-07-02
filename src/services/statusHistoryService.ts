import type { EmergencyStatus } from "../domain/emergencyStatus";

export type ReportStatusHistoryItem = {
  created_at: string;
  id: string;
  new_status: EmergencyStatus;
  observation: string | null;
  old_status: EmergencyStatus | null;
};

type StatusHistoryQuery = {
  eq: (column: string, value: unknown) => StatusHistoryQuery;
  order: (column: string, options?: Record<string, unknown>) => PromiseLike<{ data: unknown; error: Error | null }>;
  select: (columns?: string) => StatusHistoryQuery;
};

export type StatusHistoryClient = {
  from: (table: string) => {
    select: (columns?: string) => StatusHistoryQuery;
  };
};

export async function listReportStatusHistory(
  client: StatusHistoryClient,
  reportId: string
): Promise<ReportStatusHistoryItem[]> {
  const { data, error } = await client
    .from("report_status_history")
    .select("id,old_status,new_status,observation,created_at")
    .eq("report_id", reportId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as ReportStatusHistoryItem[];
}
