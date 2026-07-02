import { describe, expect, it } from "vitest";
import { createCitizenStatusNotification, createFirefighterReportNotification } from "./firefighterNotifications";

describe("firefighter notifications", () => {
  it("creates an in-app notification for a new emergency report", () => {
    const notification = createFirefighterReportNotification({
      address_text: "Av. Central 123",
      id: "report-1",
      status: "ENVIADO",
      type: "INCENDIO"
    });

    expect(notification).toEqual({
      href: "/bombero/reportes/report-1",
      message: "INCENDIO en Av. Central 123",
      title: "Nuevo reporte asignado"
    });
  });

  it("uses a generic location label when the address is missing", () => {
    const notification = createFirefighterReportNotification({
      address_text: null,
      id: "report-2",
      status: "ENVIADO",
      type: "RESCATE"
    });

    expect(notification?.message).toBe("RESCATE en ubicacion registrada");
  });

  it("ignores non-new report changes", () => {
    expect(
      createFirefighterReportNotification({
        address_text: "Av. Central 123",
        id: "report-1",
        status: "RECIBIDO",
        type: "INCENDIO"
      })
    ).toBeNull();
  });
});

describe("citizen status notifications", () => {
  it("creates an in-app notification when a report status changes", () => {
    expect(createCitizenStatusNotification("RECIBIDO", "EN_CAMINO")).toEqual({
      href: "",
      message: "Bombero en camino",
      title: "Estado actualizado"
    });
  });

  it("ignores updates that keep the same status", () => {
    expect(createCitizenStatusNotification("EN_CAMINO", "EN_CAMINO")).toBeNull();
  });
});
