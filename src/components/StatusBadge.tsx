import { EMERGENCY_STATUS_LABELS, type EmergencyStatus } from "../domain/emergencyStatus";

export function StatusBadge({ status }: { status: EmergencyStatus }) {
  const className = {
    ENVIADO: "bg-blue-50 text-blue-700",
    RECIBIDO: "bg-emerald-50 text-success",
    EN_CAMINO: "bg-amber-50 text-amber-700",
    ATENDIENDO: "bg-violet-50 text-violet-700",
    FINALIZADO: "bg-emerald-50 text-success",
    SIN_COMPANIA_DISPONIBLE: "bg-slate-100 text-slate-700"
  }[status];

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide ${className}`}>
      {EMERGENCY_STATUS_LABELS[status]}
    </span>
  );
}
