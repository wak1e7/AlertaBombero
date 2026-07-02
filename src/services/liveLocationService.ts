import { isValidCoordinate, type Coordinate } from "../domain/location";

export type LiveLocation = Coordinate & {
  report_id: string;
  updated_at?: string;
};

type LiveLocationQuery = {
  eq: (column: string, value: unknown) => LiveLocationQuery;
  limit: (count: number) => PromiseLike<{ data: unknown; error: Error | null }>;
  order: (column: string, options?: Record<string, unknown>) => LiveLocationQuery;
  select: (columns?: string) => LiveLocationQuery;
};

export type LiveLocationClient = {
  from?: (table: string) => {
    select: (columns?: string) => LiveLocationQuery;
  };
  rpc?: (
    fn: string,
    params: Record<string, unknown>
  ) => PromiseLike<{ data: LiveLocation | null; error: Error | null }>;
};

export async function upsertLiveLocation(
  client: LiveLocationClient,
  input: Coordinate & { reportId: string }
): Promise<LiveLocation | null> {
  if (!isValidCoordinate(input)) {
    throw new Error("Ubicacion invalida.");
  }
  if (!client.rpc) {
    throw new Error("Cliente Supabase incompleto.");
  }

  const { data, error } = await client.rpc("upsert_live_location", {
    p_latitude: input.latitude,
    p_longitude: input.longitude,
    p_report_id: input.reportId
  });

  if (error) throw error;
  return data;
}

export async function getLatestLiveLocation(
  client: LiveLocationClient,
  reportId: string
): Promise<LiveLocation | null> {
  if (!client.from) {
    throw new Error("Cliente Supabase incompleto.");
  }

  const { data, error } = await client
    .from("live_locations")
    .select("report_id,latitude,longitude,updated_at")
    .eq("report_id", reportId)
    .order("updated_at", { ascending: false })
    .limit(1);

  if (error) throw error;

  const rows = (data ?? []) as LiveLocation[];
  return rows[0] ?? null;
}
