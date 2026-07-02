export const persistedEmergencyStatuses = [
  "ENVIADO",
  "RECIBIDO",
  "EN_CAMINO",
  "ATENDIENDO",
  "FINALIZADO",
  "SIN_COMPANIA_DISPONIBLE"
] as const;

export type EmergencyStatus = (typeof persistedEmergencyStatuses)[number];

export const EMERGENCY_STATUS_LABELS: Record<EmergencyStatus, string> = {
  ENVIADO: "Reporte enviado",
  RECIBIDO: "Reporte recibido",
  EN_CAMINO: "Bombero en camino",
  ATENDIENDO: "Atendiendo emergencia",
  FINALIZADO: "Emergencia finalizada",
  SIN_COMPANIA_DISPONIBLE: "Sin compania disponible"
};

export type FirefighterStatusAction = {
  label: string;
  nextStatus: Extract<EmergencyStatus, "RECIBIDO" | "EN_CAMINO" | "ATENDIENDO" | "FINALIZADO">;
};

export function getNextFirefighterStatusAction(status: EmergencyStatus): FirefighterStatusAction | null {
  const actions: Partial<Record<EmergencyStatus, FirefighterStatusAction>> = {
    ATENDIENDO: { label: "Marcar finalizado", nextStatus: "FINALIZADO" },
    ENVIADO: { label: "Marcar recibido", nextStatus: "RECIBIDO" },
    EN_CAMINO: { label: "Marcar atendiendo", nextStatus: "ATENDIENDO" },
    RECIBIDO: { label: "Marcar en camino", nextStatus: "EN_CAMINO" }
  };

  return actions[status] ?? null;
}
