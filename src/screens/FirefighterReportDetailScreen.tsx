import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Camera, MapPin } from "lucide-react";
import { AppShell } from "../components/AppShell";
import { StatusBadge } from "../components/StatusBadge";
import { getNextFirefighterStatusAction } from "../domain/emergencyStatus";
import { getSupabaseClient } from "../lib/supabase";
import {
  getFirefighterReportDetail,
  updateFirefighterReportStatus,
  type FirefighterClient,
  type FirefighterReportDetail
} from "../services/firefighterService";

const firefighterClient = () => getSupabaseClient() as unknown as FirefighterClient;

export function FirefighterReportDetailScreen() {
  const { id } = useParams();
  const [report, setReport] = useState<FirefighterReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadReport() {
    if (!id) return;
    setError("");

    try {
      setReport(await getFirefighterReportDetail(firefighterClient(), id));
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
      .subscribe();

    return () => {
      getSupabaseClient().removeChannel(channel);
    };
  }, [id]);

  async function advanceStatus() {
    if (!report) return;
    const action = getNextFirefighterStatusAction(report.status);
    if (!action) return;

    setSaving(true);
    setError("");

    try {
      await updateFirefighterReportStatus(firefighterClient(), report.id, action.nextStatus);
      await loadReport();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo actualizar el estado.");
    } finally {
      setSaving(false);
    }
  }

  const action = report ? getNextFirefighterStatusAction(report.status) : null;

  return (
    <AppShell>
      <header className="flex items-center gap-3 pt-6">
        <Link className="grid h-10 w-10 place-items-center rounded-full bg-white text-ink shadow-soft" to="/bombero/reportes">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-emergency-600">Detalle</p>
          <h1 className="text-xl font-black text-ink">Emergencia asignada</h1>
        </div>
      </header>

      {loading ? <p className="mt-6 text-sm font-semibold text-muted">Cargando emergencia...</p> : null}
      {error ? <p className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">{error}</p> : null}

      {report ? (
        <section className="mt-5 space-y-4">
          <div className="rounded-lg border border-emergency-100 bg-white p-5 shadow-soft">
            <StatusBadge status={report.status} />
            <h2 className="mt-4 text-2xl font-black text-ink">{report.type}</h2>
            <p className="mt-3 text-sm font-medium text-muted">{report.description ?? "Sin descripcion adicional"}</p>
            <div className="mt-4 flex gap-3 text-sm font-medium text-muted">
              <MapPin className="h-5 w-5 text-emergency-600" />
              <span>
                {report.address_text ?? "Ubicacion registrada"} ({Number(report.latitude).toFixed(4)},{" "}
                {Number(report.longitude).toFixed(4)})
              </span>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4">
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
                  className="block rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-emergency-600"
                  href={item.signedUrl}
                  key={item.id}
                  rel="noreferrer"
                  target="_blank"
                >
                  Ver {item.file_type.startsWith("video/") ? "video" : "imagen"}
                </a>
              ))}
            </div>
          </div>

          {action ? (
            <button className="btn-primary" disabled={saving} onClick={advanceStatus} type="button">
              {saving ? "Actualizando..." : action.label}
            </button>
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
