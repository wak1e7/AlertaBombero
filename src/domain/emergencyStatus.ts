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
