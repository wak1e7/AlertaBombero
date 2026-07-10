import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Navigation, RefreshCw } from "lucide-react";
import { AppShell } from "../components/AppShell";
import { InAppNotificationBanner } from "../components/InAppNotificationBanner";
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
      <header className="flex items-center justify-between pt-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-emergency-600">Bombero</p>
          <h1 className="mt-1 text-2xl font-black text-ink">Reportes activos</h1>
        </div>
        <button
          aria-label="Actualizar reportes"
          className="grid h-10 w-10 place-items-center rounded-full bg-white text-emergency-600 shadow-soft"
          onClick={loadReports}
          type="button"
        >
          <RefreshCw className="h-5 w-5" />
        </button>
      </header>

      {error ? <p className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">{error}</p> : null}
      <InAppNotificationBanner notification={notification} onDismiss={() => setNotification(null)} />
      {loading ? <p className="mt-6 text-sm font-semibold text-muted" role="status">Cargando reportes...</p> : null}
      {!loading && reports.length === 0 ? (
        <p className="mt-6 rounded-lg border border-slate-200 bg-white p-4 text-sm font-semibold text-muted">
          No hay reportes activos asignados a tu compania.
        </p>
      ) : null}

      <section className="mt-5 space-y-3">
        {reports.map((report) => (
          <Link
            className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-soft"
            key={report.id}
            to={`/bombero/reportes/${report.id}`}
          >
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
