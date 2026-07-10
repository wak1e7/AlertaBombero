import { fireEvent, render, screen } from "@testing-library/react";
import { Home, UserRound } from "lucide-react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { AppShell } from "./AppShell";

describe("AppShell", () => {
  it("marks the current bottom navigation item", () => {
    render(
      <MemoryRouter initialEntries={["/ciudadano/perfil"]}>
        <AppShell
          navItems={[
            { href: "/ciudadano/inicio", label: "Inicio", icon: Home },
            { href: "/ciudadano/perfil", label: "Perfil", icon: UserRound }
          ]}
        >
          <h1>Perfil</h1>
        </AppShell>
      </MemoryRouter>
    );

    expect(screen.getByRole("link", { name: "Perfil" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Inicio" })).not.toHaveAttribute("aria-current");
  });

  it("shows the offline emergency screen when connectivity is lost", () => {
    Object.defineProperty(window.navigator, "onLine", { configurable: true, value: true });

    render(
      <MemoryRouter>
        <AppShell>
          <h1>Contenido operativo</h1>
        </AppShell>
      </MemoryRouter>
    );

    Object.defineProperty(window.navigator, "onLine", { configurable: true, value: false });
    fireEvent(window, new Event("offline"));

    expect(screen.getByRole("heading", { name: "Sin conexion" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Llamar 116" })).toHaveAttribute("href", "tel:116");
    expect(screen.queryByRole("heading", { name: "Contenido operativo" })).not.toBeInTheDocument();

    Object.defineProperty(window.navigator, "onLine", { configurable: true, value: true });
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));

    expect(screen.getByRole("heading", { name: "Contenido operativo" })).toBeInTheDocument();
  });
});
