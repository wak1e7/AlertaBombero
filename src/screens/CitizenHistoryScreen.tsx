import { useEffect, useMemo, useState } from "react";
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
  const [filter, setFilter] = useState<"all" | "active" | "finished">("all");
  const visibleReports = useMemo(
    () => reports.filter((report) => filter === "all" || (filter === "finished" ? report.status === "FINALIZADO" : report.status !== "FINALIZADO")),
    [filter, reports]
  );

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
      <header className="screen-header pt-6">
        <p className="section-kicker">Historial</p>
        <h1 className="page-heading mt-1">Mis reportes</h1>
        <p className="mt-1 text-xs font-medium text-muted">Consulta el estado de tus reportes.</p>
      </header>
      <div className="mt-5 grid grid-cols-3 rounded-lg bg-slate-100 p-1">
        <HistoryFilter active={filter === "all"} label="Todos" onClick={() => setFilter("all")} />
        <HistoryFilter active={filter === "active"} label="Activos" onClick={() => setFilter("active")} />
        <HistoryFilter active={filter === "finished"} label="Finalizados" onClick={() => setFilter("finished")} />
      </div>
      <section className="mt-4 space-y-2.5">
        {loading ? <p className="text-sm font-semibold text-muted" role="status">Cargando reportes...</p> : null}
        {!loading && visibleReports.length === 0 ? (
          <p className="app-card p-4 text-sm font-semibold text-muted">
            Aun no tienes reportes enviados.
          </p>
        ) : null}
        {visibleReports.map((report) => (
          <Link
            className="app-card flex min-h-28 items-center gap-3 p-3.5 transition hover:border-emergency-200"
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

function HistoryFilter({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return <button className={`min-h-9 rounded-md px-1 text-[11px] font-bold transition ${active ? "bg-emergency-600 text-white shadow-sm" : "text-muted"}`} onClick={onClick} type="button">{label}</button>;
}
