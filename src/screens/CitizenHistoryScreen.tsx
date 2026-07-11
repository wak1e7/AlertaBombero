import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { AppShell } from "../components/AppShell";
import { ReportTypeIcon } from "../components/ReportTypeIcon";
import { StatusBadge } from "../components/StatusBadge";
import type { EmergencyStatus } from "../domain/emergencyStatus";
import { getSupabaseClient } from "../lib/supabase";

type ReportListItem = {
  address_text: string | null;
  created_at: string;
  id: string;
  status: EmergencyStatus;
  type: string;
};

export function CitizenHistoryScreen({ navItems }: { navItems: Parameters<typeof AppShell>[0]["navItems"] }) {
  const [reports, setReports] = useState<ReportListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    async function loadReports() {
      const { data } = await getSupabaseClient()
        .from("emergency_reports")
        .select("id,type,status,address_text,created_at")
        .order("created_at", { ascending: false });

      if (alive) {
        setReports((data ?? []) as ReportListItem[]);
        setLoading(false);
      }
    }

    loadReports().catch(() => {
      if (alive) {
        setLoading(false);
      }
    });

    return () => {
      alive = false;
    };
  }, []);

  return (
    <AppShell navItems={navItems}>
      <header className="pt-6">
        <p className="section-kicker">Historial</p>
        <h1 className="page-heading mt-1">Mis reportes</h1>
        <p className="mt-1 text-xs font-medium text-muted">Consulta el estado de tus reportes.</p>
      </header>
      <section className="mt-5 space-y-3">
        {loading ? <p className="text-sm font-semibold text-muted" role="status">Cargando reportes...</p> : null}
        {!loading && reports.length === 0 ? (
          <p className="app-card p-4 text-sm font-semibold text-muted">
            Aun no tienes reportes enviados.
          </p>
        ) : null}
        {reports.map((report) => (
          <Link
            className="app-card flex items-center gap-3 p-3.5 transition hover:border-emergency-200"
            key={report.id}
            to={`/ciudadano/seguimiento/${report.id}`}
          >
            <ReportTypeIcon type={report.type} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-black text-ink">{report.type}</p>
                <StatusBadge status={report.status} />
              </div>
              <p className="mt-2 text-xs font-medium leading-relaxed text-muted">{report.address_text ?? "Sin direccion"}</p>
              <p className="mt-1 text-xs text-muted">{new Date(report.created_at).toLocaleString()}</p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted" />
          </Link>
        ))}
      </section>
    </AppShell>
  );
}
