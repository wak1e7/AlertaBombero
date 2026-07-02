import { describe, expect, it } from "vitest";
import {
  EMERGENCY_STATUS_LABELS,
  getNextFirefighterStatusAction,
  persistedEmergencyStatuses
} from "./emergencyStatus";

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

  it("returns the next firefighter action for active operational statuses", () => {
    expect(getNextFirefighterStatusAction("ENVIADO")).toEqual({
      label: "Marcar recibido",
      nextStatus: "RECIBIDO"
    });
    expect(getNextFirefighterStatusAction("RECIBIDO")?.nextStatus).toBe("EN_CAMINO");
    expect(getNextFirefighterStatusAction("EN_CAMINO")?.nextStatus).toBe("ATENDIENDO");
    expect(getNextFirefighterStatusAction("ATENDIENDO")?.nextStatus).toBe("FINALIZADO");
  });

  it("does not offer firefighter actions for terminal or unavailable statuses", () => {
    expect(getNextFirefighterStatusAction("FINALIZADO")).toBeNull();
    expect(getNextFirefighterStatusAction("SIN_COMPANIA_DISPONIBLE")).toBeNull();
  });
});
