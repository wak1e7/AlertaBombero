import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { InAppNotificationBanner } from "./InAppNotificationBanner";

describe("InAppNotificationBanner", () => {
  it("renders the notification with a link and close action", async () => {
    const onDismiss = vi.fn();

    render(
      <MemoryRouter>
        <InAppNotificationBanner
          notification={{
            href: "/bombero/reportes/report-1",
            message: "INCENDIO en Av. Central 123",
            title: "Nuevo reporte asignado"
          }}
          onDismiss={onDismiss}
        />
      </MemoryRouter>
    );

    expect(screen.getByText("Nuevo reporte asignado")).toBeInTheDocument();
    expect(screen.getByText("INCENDIO en Av. Central 123")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Ver reporte/i })).toHaveAttribute(
      "href",
      "/bombero/reportes/report-1"
    );

    await userEvent.click(screen.getByRole("button", { name: "Cerrar notificacion" }));
    expect(onDismiss).toHaveBeenCalled();
  });

  it("renders nothing without a notification", () => {
    const { container } = render(<InAppNotificationBanner notification={null} onDismiss={vi.fn()} />);

    expect(container).toBeEmptyDOMElement();
  });
});
