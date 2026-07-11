import { EMERGENCY_STATUS_LABELS } from "../domain/emergencyStatus";
import type { ReportStatusHistoryItem } from "../services/statusHistoryService";

export function StatusTimeline({ items }: { items: ReportStatusHistoryItem[] }) {
  return (
    <div className="app-card p-4">
      <p className="text-sm font-black text-ink">Linea de tiempo</p>
      <p className="mt-0.5 text-xs font-medium text-muted">Seguimiento del reporte</p>
      {items.length === 0 ? (
        <p className="mt-3 text-xs font-semibold text-muted">Aun no hay historial registrado.</p>
      ) : (
          <ol className="mt-4 space-y-0">
            {items.map((item) => (
            <li className="relative flex gap-3 pb-4 last:pb-0" key={item.id}>
              <span className="relative z-10 mt-0.5 grid h-5 w-5 place-items-center rounded-full bg-emerald-50 ring-4 ring-white">
                <span className="h-2 w-2 rounded-full bg-success" />
              </span>
              <span className="absolute left-[9px] top-5 h-[calc(100%-0.4rem)] w-px bg-slate-200 last:hidden" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-extrabold text-ink">{EMERGENCY_STATUS_LABELS[item.new_status]}</span>
                <span className="mt-0.5 block text-xs font-medium text-muted">
                  {new Date(item.created_at).toLocaleString()}
                  {item.observation ? ` - ${item.observation}` : ""}
                </span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
