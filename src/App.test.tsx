import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "./App";

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
});
