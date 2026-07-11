import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { App, FirefighterHome } from "./App";

describe("App", () => {
  it("renders the role access screen as the first experience", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: /AlertaBombero/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Soy ciudadano/i })).toHaveAttribute(
      "href",
      "/ciudadano/login"
    );
    expect(screen.getByRole("link", { name: /Soy bombero/i })).toHaveAttribute(
      "href",
      "/bombero/login"
    );
  });

  it("renders form errors as alerts", async () => {
    window.history.pushState({}, "", "/ciudadano/login");
    render(<App />);

    await userEvent.click(screen.getByRole("button", { name: "Ingresar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/telefono/i);
  });

  it("keeps the firefighter emergency action visible on the operational home", () => {
    render(
      <MemoryRouter initialEntries={["/bombero/inicio"]}>
        <FirefighterHome />
      </MemoryRouter>
    );

    expect(screen.getByRole("button", { name: /reportaremergencia/i })).toBeInTheDocument();
  });
});
