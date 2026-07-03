import { render, screen } from "@testing-library/react";
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
});
