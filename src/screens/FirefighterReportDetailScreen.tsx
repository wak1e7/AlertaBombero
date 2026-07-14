import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Camera, LocateFixed, MapPin } from "lucide-react";
import { AppShell } from "../components/AppShell";
import { BrandLogo } from "../components/BrandLogo";
import { ReportTypeIcon } from "../components/ReportTypeIcon";
import { StatusBadge } from "../components/StatusBadge";
import { StatusTimeline } from "../components/StatusTimeline";
import { TrackingMap } from "../components/TrackingMap";
import { getNextFirefighterStatusAction } from "../domain/emergencyStatus";
import { formatCoordinatePair } from "../domain/location";
import { getSupabaseClient } from "../lib/supabase";
import {
  getFirefighterReportDetail,
  updateFirefighterReportStatus,
  type FirefighterClient,
  type FirefighterReportDetail
} from "../services/firefighterService";
import {
  getLatestLiveLocation,
  upsertLiveLocation,
  type LiveLocation,
  type LiveLocationClient
} from "../services/liveLocationService";
import {
  listReportStatusHistory,
  type ReportStatusHistoryItem,
  type StatusHistoryClient
} from "../services/statusHistoryService";

const firefighterClient = () => getSupabaseClient() as unknown as FirefighterClient;
const liveLocationClient = () => getSupabaseClient() as unknown as LiveLocationClient;
const statusHistoryClient = () => getSupabaseClient() as unknown as StatusHistoryClient;

export function FirefighterReportDetailScreen() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [report, setReport] = useState<FirefighterReportDetail | null>(null);
  const [liveLocation, setLiveLocation] = useState<LiveLocation | null>(null);
  const [history, setHistory] = useState<ReportStatusHistoryItem[]>([]);
  const [tracking, setTracking] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadReport() {
    if (!id) return;
    setError("");

    try {
      setReport(await getFirefighterReportDetail(firefighterClient(), id));
      setLiveLocation(await getLatestLiveLocation(liveLocationClient(), id));
      setHistory(await listReportStatusHistory(statusHistoryClient(), id));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo cargar el detalle.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReport();
    if (!id) return;

    const channel = getSupabaseClient()
      .channel(`firefighter-report-${id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "emergency_reports", filter: `id=eq.${id}` }, loadReport)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "report_status_history", filter: `report_id=eq.${id}` }, (payload) => {
        setHistory((current) => [...current, payload.new as ReportStatusHistoryItem]);
      })
      .subscribe();

    return () => {
      getSupabaseClient().removeChannel(channel);
    };
  }, [id]);

  useEffect(() => {
    if (!tracking || !report || report.status !== "EN_CAMINO") return;

    if (!navigator.geolocation) {
      setError("Tu navegador no permite compartir ubicacion.");
      setTracking(false);
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        try {
          const saved = await upsertLiveLocation(liveLocationClient(), {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            reportId: report.id
          });
          setLiveLocation(saved);
        } catch (caught) {
          setError(caught instanceof Error ? caught.message : "No se pudo actualizar la ubicacion.");
          setTracking(false);
        }
      },
      () => {
        setError("No se pudo obtener tu ubicacion.");
        setTracking(false);
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [report?.id, report?.status, tracking]);

  useEffect(() => {
    if (report?.status === "EN_CAMINO") setTracking(true);
  }, [report?.id, report?.status]);

  async function advanceStatus() {
    if (!report) return;
    const action = getNextFirefighterStatusAction(report.status);
    if (!action) return;

    setSaving(true);
    setError("");

    try {
      const updatedReport = await updateFirefighterReportStatus(firefighterClient(), report.id, action.nextStatus);
      if (updatedReport.status === "EN_CAMINO") setTracking(true);
      await loadReport();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo actualizar el estado.");
    } finally {
      setSaving(false);
    }
  }

  const action = report ? getNextFirefighterStatusAction(report.status) : null;
  const backPath = searchParams.get("from") === "historial" ? "/bombero/historial" : "/bombero/reportes";
  const backLabel = searchParams.get("from") === "historial" ? "Volver al historial" : "Volver a reportes";

  return (
    <AppShell>
      <header className="screen-header flex items-center gap-3 pt-5">
        <Link aria-label={backLabel} className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 bg-white text-ink shadow-soft" to={backPath}>
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex min-w-0 items-center gap-2">
          <BrandLogo />
          <div><h1 className="text-base font-black text-ink">Emergencia asignada</h1><p className="text-[10px] font-medium text-muted">Detalle de reporte</p></div>
        </div>
      </header>

      {loading ? <p className="mt-6 text-sm font-semibold text-muted" role="status">Cargando emergencia...</p> : null}
      {error ? <p className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">{error}</p> : null}

      {report ? (
        <section className="firefighter-detail mt-5 space-y-3">
          <div className="app-card p-4">
            <div className="flex items-center gap-3"><ReportTypeIcon type={report.type} /><div><StatusBadge status={report.status} /><h2 className="mt-1 text-xl font-black text-ink">{report.type}</h2></div></div>
            <p className="mt-3 text-sm font-medium text-muted">{report.description ?? "Sin descripcion adicional"}</p>
            <div className="mt-4 flex gap-3 text-sm font-medium text-muted">
              <MapPin className="h-5 w-5 text-emergency-600" />
              <span>
                {report.address_text ?? "Ubicacion registrada"} ({Number(report.latitude).toFixed(4)},{" "}
                {Number(report.longitude).toFixed(4)})
              </span>
            </div>
          </div>

          <TrackingMap
            emergency={{ latitude: Number(report.latitude), longitude: Number(report.longitude) }}
            firefighter={liveLocation}
          />

          {report.status === "EN_CAMINO" ? (
            <div className="app-card p-4">
              <p className="flex items-center gap-2 text-sm font-black text-ink">
                <LocateFixed className="h-5 w-5 text-emergency-600" />
                Ubicacion en vivo
              </p>
              <p className="mt-2 text-xs font-semibold text-muted">
                {liveLocation ? formatCoordinatePair(liveLocation) : tracking ? "Obteniendo ubicacion del dispositivo..." : "Ubicacion no disponible."}
              </p>
              <p className="mt-3 text-[11px] font-medium leading-relaxed text-muted">La ubicacion se comparte automaticamente mientras el bombero esta en camino.</p>
            </div>
          ) : null}

          <div className="app-card p-4">
            <p className="flex items-center gap-2 text-sm font-black text-ink">
              <Camera className="h-5 w-5 text-emergency-600" />
              Evidencia
            </p>
            <div className="mt-3 space-y-2">
              {report.evidence.length === 0 ? (
                <p className="text-xs font-semibold text-muted">No hay evidencia disponible.</p>
              ) : null}
              {report.evidence.map((item) => (
                <a
                  className="block overflow-hidden rounded-lg border border-slate-200 bg-white text-sm font-bold text-emergency-600"
                  href={item.signedUrl}
                  key={item.id}
                  rel="noreferrer"
                  target="_blank"
                >
                  {item.file_type.startsWith("video/") ? <video className="h-36 w-full bg-slate-950 object-cover" muted preload="metadata" src={item.signedUrl} /> : <img alt="Evidencia del reporte" className="h-36 w-full object-cover" src={item.signedUrl} />}
                  <span className="flex items-center justify-between px-3 py-2">Ver {item.file_type.startsWith("video/") ? "video" : "imagen"}<span className="text-[10px] text-muted">Abrir</span></span>
                </a>
              ))}
            </div>
          </div>

          <StatusTimeline items={history} />

          {action ? (
            <div className="sticky bottom-0 -mx-4 bg-app/95 px-4 pb-2 pt-3 backdrop-blur"><button className="btn-primary" disabled={saving} onClick={advanceStatus} type="button">
              {saving ? "Actualizando..." : action.label}
            </button></div>
          ) : (
            <p className="rounded-lg border border-slate-200 bg-white p-4 text-sm font-bold text-muted">
              Este reporte ya no acepta cambios operativos.
            </p>
          )}
        </section>
      ) : null}
    </AppShell>
  );
}
