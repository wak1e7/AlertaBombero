import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, RefreshCw } from "lucide-react";
import { AppShell } from "../components/AppShell";
import { ReportTypeIcon } from "../components/ReportTypeIcon";
import { StatusBadge } from "../components/StatusBadge";
import { getSupabaseClient } from "../lib/supabase";
import {
  listCompanyFirefighterHistory,
  type FirefighterClient,
  type FirefighterReportSummary
} from "../services/firefighterService";

const firefighterClient = () => getSupabaseClient() as unknown as FirefighterClient;

export function FirefighterHistoryScreen({ navItems }: { navItems: Parameters<typeof AppShell>[0]["navItems"] }) {
  const [reports, setReports] = useState<FirefighterReportSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadReports() {
    setLoading(true);
    setError("");

    try {
      setReports(await listCompanyFirefighterHistory(firefighterClient()));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo cargar el historial.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReports();

    const channel = getSupabaseClient()
      .channel("firefighter-history")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "emergency_reports" }, loadReports)
      .subscribe();

    return () => {
      getSupabaseClient().removeChannel(channel);
    };
  }, []);

  return (
    <AppShell navItems={navItems}>
      <header className="flex items-center justify-between pt-6">
        <div>
          <p className="section-kicker">Historial</p>
          <h1 className="page-heading mt-1">Reportes finalizados</h1>
          <p className="mt-1 text-xs font-medium text-muted">Historial de mi compania</p>
        </div>
        <button
          aria-label="Actualizar historial"
          className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 bg-white text-emergency-600 shadow-soft"
          onClick={loadReports}
          type="button"
        >
          <RefreshCw className="h-5 w-5" />
        </button>
      </header>

      {error ? <p className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">{error}</p> : null}
      {loading ? <p className="mt-6 text-sm font-semibold text-muted" role="status">Cargando historial...</p> : null}
      {!loading && reports.length === 0 ? (
        <p className="app-card mt-6 p-4 text-sm font-semibold text-muted">
          Aun no hay reportes finalizados en tu compania.
        </p>
      ) : null}

      <section className="mt-5 space-y-3">
        {reports.map((report) => (
          <Link
            className="app-card flex items-center gap-3 p-3.5 transition hover:border-emergency-200"
            key={report.id}
            to={`/bombero/reportes/${report.id}?from=historial`}
          >
            <ReportTypeIcon type={report.type} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-black text-ink">{report.type}</p>
                <StatusBadge status={report.status} />
              </div>
              <p className="mt-2 text-xs font-medium leading-relaxed text-muted">{report.address_text ?? "Ubicacion registrada"}</p>
              <p className="mt-1 text-xs text-muted">{new Date(report.created_at).toLocaleString()}</p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted" />
          </Link>
        ))}
      </section>
    </AppShell>
  );
}
