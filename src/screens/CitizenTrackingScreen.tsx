import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, MapPin } from "lucide-react";
import { AppShell } from "../components/AppShell";
import { StatusBadge } from "../components/StatusBadge";
import { StatusTimeline } from "../components/StatusTimeline";
import { TrackingMap } from "../components/TrackingMap";
import type { EmergencyStatus } from "../domain/emergencyStatus";
import { formatCoordinatePair } from "../domain/location";
import { getSupabaseClient } from "../lib/supabase";
import {
  getLatestLiveLocation,
  type LiveLocation,
  type LiveLocationClient
} from "../services/liveLocationService";
import {
  listReportStatusHistory,
  type ReportStatusHistoryItem,
  type StatusHistoryClient
} from "../services/statusHistoryService";

const liveLocationClient = () => getSupabaseClient() as unknown as LiveLocationClient;
const statusHistoryClient = () => getSupabaseClient() as unknown as StatusHistoryClient;

type ReportDetail = {
  address_text: string | null;
  created_at: string;
  id: string;
  latitude: number;
  longitude: number;
  status: EmergencyStatus;
  type: string;
};

export function CitizenTrackingScreen() {
  const { id } = useParams();
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [liveLocation, setLiveLocation] = useState<LiveLocation | null>(null);
  const [history, setHistory] = useState<ReportStatusHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    let alive = true;

    async function loadReport() {
      const { data, error: queryError } = await getSupabaseClient()
        .from("emergency_reports")
        .select("id,type,status,address_text,created_at,latitude,longitude")
        .eq("id", id)
        .maybeSingle();

      if (!alive) return;
      if (queryError || !data) {
        setError("No se pudo cargar el seguimiento.");
      } else {
        setReport(data as ReportDetail);
      }
      setLoading(false);
    }

    loadReport();
    getLatestLiveLocation(liveLocationClient(), id).then(setLiveLocation).catch(() => undefined);
    listReportStatusHistory(statusHistoryClient(), id).then(setHistory).catch(() => undefined);

    const channel = getSupabaseClient()
      .channel(`report-${id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "emergency_reports", filter: `id=eq.${id}` }, (payload) => {
        setReport(payload.new as ReportDetail);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "live_locations", filter: `report_id=eq.${id}` }, (payload) => {
        setLiveLocation(payload.new as LiveLocation);
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "report_status_history", filter: `report_id=eq.${id}` }, (payload) => {
        setHistory((current) => [...current, payload.new as ReportStatusHistoryItem]);
      })
      .subscribe();

    return () => {
      alive = false;
      getSupabaseClient().removeChannel(channel);
    };
  }, [id]);

  return (
    <AppShell>
      <header className="flex items-center gap-3 pt-6">
        <Link className="grid h-10 w-10 place-items-center rounded-full bg-white text-ink shadow-soft" to="/ciudadano/inicio">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-emergency-600">Seguimiento</p>
          <h1 className="text-xl font-black text-ink">Estado del reporte</h1>
        </div>
      </header>

      {loading ? <p className="mt-6 text-sm font-semibold text-muted">Cargando seguimiento...</p> : null}
      {error ? <p className="mt-6 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">{error}</p> : null}
      {report ? (
        <section className="mt-6 space-y-4">
          <div className="rounded-lg border border-emergency-100 bg-white p-5 shadow-soft">
            <StatusBadge status={report.status} />
            <h2 className="mt-4 text-2xl font-black text-ink">{report.type}</h2>
            <div className="mt-4 flex gap-3 text-sm font-medium text-muted">
              <MapPin className="h-5 w-5 text-emergency-600" />
              <span>{report.address_text ?? "Ubicacion registrada"}</span>
            </div>
          </div>
          <TrackingMap
            emergency={{ latitude: Number(report.latitude), longitude: Number(report.longitude) }}
            firefighter={liveLocation}
          />
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-sm font-black text-ink">Ubicacion del bombero</p>
            <p className="mt-2 text-xs font-semibold text-muted">
              {liveLocation
                ? `${formatCoordinatePair(liveLocation)} - actualizado ${
                    liveLocation.updated_at ? new Date(liveLocation.updated_at).toLocaleTimeString() : "recientemente"
                  }`
                : "Aparecera cuando el bombero marque en camino y active su ubicacion."}
            </p>
          </div>
          <StatusTimeline items={history} />
          <Link className="btn-secondary" to="/ciudadano/historial">
            Ver historial
          </Link>
        </section>
      ) : null}
    </AppShell>
  );
}
