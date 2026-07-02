import { EMERGENCY_STATUS_LABELS } from "../domain/emergencyStatus";
import type { ReportStatusHistoryItem } from "../services/statusHistoryService";

export function StatusTimeline({ items }: { items: ReportStatusHistoryItem[] }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-sm font-black text-ink">Linea de tiempo</p>
      {items.length === 0 ? (
        <p className="mt-3 text-xs font-semibold text-muted">Aun no hay historial registrado.</p>
      ) : (
        <ol className="mt-4 space-y-3">
          {items.map((item) => (
            <li className="flex gap-3" key={item.id}>
              <span className="mt-1 h-3 w-3 rounded-full bg-emergency-600" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-ink">{EMERGENCY_STATUS_LABELS[item.new_status]}</span>
                <span className="mt-1 block text-xs font-medium text-muted">
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
