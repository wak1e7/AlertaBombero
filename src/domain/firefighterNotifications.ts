import { EMERGENCY_STATUS_LABELS, type EmergencyStatus } from "./emergencyStatus";

export type FirefighterNotificationReport = {
  address_text: string | null;
  id: string;
  status: EmergencyStatus;
  type: string;
};

export type InAppNotification = {
  href: string;
  message: string;
  title: string;
};

export function createFirefighterReportNotification(
  report: FirefighterNotificationReport
): InAppNotification | null {
  if (report.status !== "ENVIADO") return null;

  return {
    href: `/bombero/reportes/${report.id}`,
    message: `${report.type} en ${report.address_text ?? "ubicacion registrada"}`,
    title: "Nuevo reporte asignado"
  };
}

export function createCitizenStatusNotification(
  previousStatus: EmergencyStatus,
  nextStatus: EmergencyStatus
): InAppNotification | null {
  if (previousStatus === nextStatus) return null;

  return {
    href: "",
    message: EMERGENCY_STATUS_LABELS[nextStatus],
    title: "Estado actualizado"
  };
}
