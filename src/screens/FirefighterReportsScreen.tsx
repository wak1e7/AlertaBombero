import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, ChevronDown, ChevronRight, Navigation, RefreshCw } from "lucide-react";
import { AppShell } from "../components/AppShell";
import { BrandLogo } from "../components/BrandLogo";
import { InAppNotificationBanner } from "../components/InAppNotificationBanner";
import { ReportTypeIcon } from "../components/ReportTypeIcon";
import { StatusBadge } from "../components/StatusBadge";
import { distanceInKilometers, formatApproximateDistance } from "../domain/distance";
import type { Coordinate } from "../domain/location";
import { createFirefighterReportNotification, type InAppNotification } from "../domain/firefighterNotifications";
import { getSupabaseClient } from "../lib/supabase";
import {
  listActiveFirefighterReports,
  type FirefighterClient,
  type FirefighterReportSummary
} from "../services/firefighterService";

const firefighterClient = () => getSupabaseClient() as unknown as FirefighterClient;

export function FirefighterReportsScreen({ navItems }: { navItems: Parameters<typeof AppShell>[0]["navItems"] }) {
  const [reports, setReports] = useState<FirefighterReportSummary[]>([]);
  const [notification, setNotification] = useState<InAppNotification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentLocation, setCurrentLocation] = useState<Coordinate | null>(null);
  const [filter, setFilter] = useState<"all" | "new" | "active">("all");
  const visibleReports = useMemo(
    () => reports.filter((report) => filter === "all" || (filter === "new" ? report.status === "ENVIADO" : report.status !== "ENVIADO")),
    [filter, reports]
  );

  async function loadReports() {
    setLoading(true);
    setError("");

    try {
      setReports(await listActiveFirefighterReports(firefighterClient()));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudieron cargar los reportes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReports();

    const channel = getSupabaseClient()
      .channel("firefighter-active-reports")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "emergency_reports" }, (payload) => {
        setNotification(createFirefighterReportNotification(payload.new as FirefighterReportSummary));
        loadReports();
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "emergency_reports" }, loadReports)
      .subscribe();

    return () => {
      getSupabaseClient().removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      () => undefined,
      { enableHighAccuracy: true, maximumAge: 15_000, timeout: 8_000 }
    );
  }, []);

  return (
    <AppShell navItems={navItems}>
      <header className="pt-5">
        <div className="flex items-center justify-between"><BrandLogo withName /><span className="relative grid h-9 w-9 place-items-center rounded-lg bg-emergency-50 text-emergency-600"><Bell className="h-4 w-4" /><span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-emergency-600" /></span></div>
        <div className="mt-6 flex items-end justify-between">
          <div><p className="section-kicker">Operaciones</p><h1 className="page-heading mt-1">Reportes</h1></div>
          <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-success"><span className="h-1.5 w-1.5 rounded-full bg-success" /> En linea</span>
        </div>
      </header>
      <button className="app-card mt-5 flex w-full items-center justify-between p-3 text-left" type="button">
        <span><span className="block text-[10px] font-bold uppercase tracking-wide text-muted">Cobertura operativa</span><span className="mt-0.5 block text-sm font-black text-ink">Cuerpo de Bomberos - Chiclayo</span></span><ChevronDown className="h-4 w-4 text-emergency-600" />
      </button>
      <div className="mt-4 grid grid-cols-3 rounded-lg bg-slate-100 p-1">
        <FilterButton active={filter === "all"} count={reports.length} label="Todos" onClick={() => setFilter("all")} />
        <FilterButton active={filter === "new"} count={reports.filter((report) => report.status === "ENVIADO").length} label="Nuevos" onClick={() => setFilter("new")} />
        <FilterButton active={filter === "active"} count={reports.filter((report) => report.status !== "ENVIADO").length} label="Activos" onClick={() => setFilter("active")} />
      </div>
      <button
          aria-label="Actualizar reportes"
          className="sr-only"
          onClick={loadReports}
          type="button"
        >
          <RefreshCw className="h-5 w-5" />
        </button>

      {error ? <p className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">{error}</p> : null}
      <InAppNotificationBanner notification={notification} onDismiss={() => setNotification(null)} />
      {loading ? <p className="mt-6 text-sm font-semibold text-muted" role="status">Cargando reportes...</p> : null}
      {!loading && visibleReports.length === 0 ? (
        <p className="app-card mt-6 p-4 text-sm font-semibold text-muted">
          No hay reportes activos asignados a tu compania.
        </p>
      ) : null}

      <section className="mt-5 space-y-3">
        {visibleReports.map((report) => (
          <Link
            className="app-card flex items-center gap-3 p-3.5 transition hover:border-emergency-200"
            key={report.id}
            to={`/bombero/reportes/${report.id}`}
          >
            <ReportTypeIcon type={report.type} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-black text-ink">{report.type}</p>
                <StatusBadge status={report.status} />
              </div>
              <p className="mt-2 text-xs font-medium leading-relaxed text-muted">{report.address_text ?? "Ubicacion registrada"}</p>
              <DistanceLabel currentLocation={currentLocation} reportLocation={report} />
              <p className="mt-1 text-xs text-muted">{new Date(report.created_at).toLocaleString()}</p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted" />
          </Link>
        ))}
      </section>
    </AppShell>
  );
}

function FilterButton({ active, count, label, onClick }: { active: boolean; count: number; label: string; onClick: () => void }) {
  return <button className={`min-h-9 rounded-md px-1 text-[11px] font-bold transition ${active ? "bg-white text-emergency-700 shadow-sm" : "text-muted"}`} onClick={onClick} type="button">{label} <span className="ml-0.5">{count}</span></button>;
}

function DistanceLabel({ currentLocation, reportLocation }: { currentLocation: Coordinate | null; reportLocation: Coordinate }) {
  const distance = currentLocation ? distanceInKilometers(currentLocation, reportLocation) : null;

  if (distance === null) {
    return <p className="mt-1 text-xs text-muted">Distancia no disponible</p>;
  }

  return (
    <p className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-emergency-700">
      <Navigation className="h-3.5 w-3.5" aria-hidden="true" />
      {formatApproximateDistance(distance)}
    </p>
  );
}
