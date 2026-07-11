import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Building2, MapPin } from "lucide-react";
import { BrandLogo } from "../components/BrandLogo";
import { ReportTypeIcon } from "../components/ReportTypeIcon";
import { AppShell } from "../components/AppShell";
import { InAppNotificationBanner } from "../components/InAppNotificationBanner";
import { StatusBadge } from "../components/StatusBadge";
import { StatusTimeline } from "../components/StatusTimeline";
import { TrackingMap } from "../components/TrackingMap";
import type { EmergencyStatus } from "../domain/emergencyStatus";
import { createCitizenStatusNotification, type InAppNotification } from "../domain/firefighterNotifications";
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
  company: { name: string } | null;
  created_at: string;
  id: string;
  latitude: number;
  longitude: number;
  status: EmergencyStatus;
  type: string;
};

type ReportQueryResult = Omit<ReportDetail, "company"> & {
  company: { name: string } | { name: string }[] | null;
};

export function CitizenTrackingScreen() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [liveLocation, setLiveLocation] = useState<LiveLocation | null>(null);
  const [history, setHistory] = useState<ReportStatusHistoryItem[]>([]);
  const [notification, setNotification] = useState<InAppNotification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    let alive = true;

    async function loadReport() {
      const { data, error: queryError } = await getSupabaseClient()
        .from("emergency_reports")
        .select("id,type,status,address_text,created_at,latitude,longitude,company:fire_companies(name)")
        .eq("id", id)
        .maybeSingle();

      if (!alive) return;
      if (queryError || !data) {
        setError("No se pudo cargar el seguimiento.");
      } else {
        setReport(normalizeReport(data as ReportQueryResult));
      }
      setLoading(false);
    }

    loadReport();
    getLatestLiveLocation(liveLocationClient(), id).then(setLiveLocation).catch(() => undefined);
    listReportStatusHistory(statusHistoryClient(), id).then(setHistory).catch(() => undefined);

    const channel = getSupabaseClient()
      .channel(`report-${id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "emergency_reports", filter: `id=eq.${id}` }, (payload) => {
        const nextReport = payload.new as Omit<ReportDetail, "company">;
        setReport((current) => {
          if (current) {
            setNotification(createCitizenStatusNotification(current.status, nextReport.status));
          }
          return { ...nextReport, company: current?.company ?? null };
        });
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

  const backPath = searchParams.get("from") === "historial" ? "/ciudadano/historial" : "/ciudadano/inicio";
  const backLabel = searchParams.get("from") === "historial" ? "Volver al historial" : "Volver al inicio";

  return (
    <AppShell>
      <header className="screen-header flex items-center gap-3 pt-5">
        <Link aria-label={backLabel} className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 bg-white text-ink shadow-soft" to={backPath}>
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex min-w-0 items-center gap-2">
          <BrandLogo />
          <div><h1 className="text-base font-black text-ink">Seguimiento</h1><p className="text-[10px] font-medium text-muted">Tu emergencia esta siendo atendida</p></div>
        </div>
      </header>

      {loading ? <p className="mt-6 text-sm font-semibold text-muted" role="status">Cargando seguimiento...</p> : null}
      {error ? <p className="mt-6 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">{error}</p> : null}
      <InAppNotificationBanner notification={notification} onDismiss={() => setNotification(null)} />
      {report ? (
        <section className="mt-6 space-y-4">
          <div className="app-card p-4">
            <div className="flex items-center gap-3"><ReportTypeIcon type={report.type} /><div className="min-w-0 flex-1"><StatusBadge status={report.status} /><h2 className="mt-1 text-lg font-black text-ink">{report.type}</h2></div></div>
            <div className="mt-4 flex gap-3 text-sm font-medium text-muted">
              <MapPin className="h-5 w-5 text-emergency-600" />
              <span>{report.address_text ?? "Ubicacion registrada"}</span>
            </div>
            <div className="mt-3 flex gap-3 text-sm font-medium text-muted">
              <Building2 className="h-5 w-5 text-emergency-600" />
              <span>{report.company?.name ?? "Compania por asignar"}</span>
            </div>
          </div>
          <TrackingMap
            emergency={{ latitude: Number(report.latitude), longitude: Number(report.longitude) }}
            firefighter={liveLocation}
          />
          <div className="app-card p-4">
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

function normalizeReport(report: ReportQueryResult): ReportDetail {
  const company = Array.isArray(report.company) ? report.company[0] ?? null : report.company;
  return { ...report, company };
}
