import { describe, expect, it } from "vitest";
import { EMERGENCY_STATUS_LABELS, persistedEmergencyStatuses } from "./emergencyStatus";

describe("emergency status contracts", () => {
  it("keeps the persisted status order from the MVP specification", () => {
    expect(persistedEmergencyStatuses).toEqual([
      "ENVIADO",
      "RECIBIDO",
      "EN_CAMINO",
      "ATENDIENDO",
      "FINALIZADO",
      "SIN_COMPANIA_DISPONIBLE"
    ]);
  });

  it("maps every persisted status to a citizen-friendly label", () => {
    expect(Object.keys(EMERGENCY_STATUS_LABELS)).toEqual(persistedEmergencyStatuses);
    expect(EMERGENCY_STATUS_LABELS.EN_CAMINO).toBe("Bombero en camino");
  });
});
