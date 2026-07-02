import { EMERGENCY_STATUS_LABELS, type EmergencyStatus } from "../domain/emergencyStatus";

export function StatusBadge({ status }: { status: EmergencyStatus }) {
  return (
    <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-success">
      {EMERGENCY_STATUS_LABELS[status]}
    </span>
  );
}
