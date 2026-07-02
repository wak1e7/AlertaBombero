import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusTimeline } from "./StatusTimeline";
import type { ReportStatusHistoryItem } from "../services/statusHistoryService";

describe("StatusTimeline", () => {
  it("renders an empty state when there are no status entries", () => {
    render(<StatusTimeline items={[]} />);

    expect(screen.getByText("Linea de tiempo")).toBeInTheDocument();
    expect(screen.getByText("Aun no hay historial registrado.")).toBeInTheDocument();
  });

  it("renders status labels and observations", () => {
    const items: ReportStatusHistoryItem[] = [
      {
        created_at: "2026-07-02T10:15:00.000Z",
        id: "history-1",
        new_status: "EN_CAMINO",
        observation: "Unidad salio de la compania",
        old_status: "RECIBIDO"
      }
    ];

    render(<StatusTimeline items={items} />);

    expect(screen.getByText("Bombero en camino")).toBeInTheDocument();
    expect(screen.getByText(/Unidad salio de la compania/)).toBeInTheDocument();
  });
});
