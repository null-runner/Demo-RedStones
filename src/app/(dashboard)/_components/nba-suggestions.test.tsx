import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { NbaSuggestions } from "./nba-suggestions";
import type { NbaSuggestion } from "../_lib/nba.service";

function makeSuggestion(overrides: Partial<NbaSuggestion> = {}): NbaSuggestion {
  return {
    id: "deal-1-follow_up",
    type: "follow_up",
    message: "Invia follow-up — fermo da 8 giorni",
    entityType: "deal",
    entityId: "deal-1",
    entityTitle: "Deal Test",
    priority: "medium",
    ...overrides,
  };
}

describe("NbaSuggestions", () => {
  it("renderizza messaggio e entityTitle per ogni suggerimento", () => {
    const suggestions = [
      makeSuggestion({
        message: "Invia follow-up — fermo da 8 giorni",
        entityTitle: "Deal Alfa",
      }),
    ];
    render(<NbaSuggestions suggestions={suggestions} />);
    expect(screen.getByText("Invia follow-up — fermo da 8 giorni")).toBeInTheDocument();
    expect(screen.getByText("Deal Alfa")).toBeInTheDocument();
  });

  it("renderizza più suggerimenti nell'ordine ricevuto", () => {
    const suggestions = [
      makeSuggestion({ id: "s1", message: "Primo messaggio", priority: "high" }),
      makeSuggestion({ id: "s2", message: "Secondo messaggio", priority: "low" }),
    ];
    render(<NbaSuggestions suggestions={suggestions} />);
    const items = screen.getAllByRole("link");
    expect(items[0]).toHaveTextContent("Primo messaggio");
    expect(items[1]).toHaveTextContent("Secondo messaggio");
  });

  it("suggerimento deal ha link a /deals/[id]", () => {
    const s = makeSuggestion({ entityType: "deal", entityId: "deal-123" });
    render(<NbaSuggestions suggestions={[s]} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/deals/deal-123");
  });

  it("suggerimento contatto ha link a /contacts/[id]", () => {
    const s = makeSuggestion({
      entityType: "contact",
      entityId: "contact-456",
      type: "reactivate_contact",
    });
    render(<NbaSuggestions suggestions={[s]} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/contacts/contact-456");
  });

  it("mostra empty state quando suggestions è vuoto", () => {
    render(<NbaSuggestions suggestions={[]} />);
    expect(screen.getByText(/Tutto in ordine/)).toBeInTheDocument();
  });

  it("mostra emptyStateMessage personalizzato quando passato con array vuoto", () => {
    render(<NbaSuggestions suggestions={[]} emptyStateMessage="Deal concluso" />);
    expect(screen.getByText("Deal concluso")).toBeInTheDocument();
  });

  it("badge priorità high è etichettato Alta", () => {
    const s = makeSuggestion({ priority: "high" });
    render(<NbaSuggestions suggestions={[s]} />);
    expect(screen.getByText("Alta")).toBeInTheDocument();
  });

  it("badge priorità medium ha classi CSS yellow", () => {
    const s = makeSuggestion({ priority: "medium" });
    render(<NbaSuggestions suggestions={[s]} />);
    const badge = screen.getByText("Media");
    expect(badge.className).toMatch(/bg-yellow-100/);
    expect(badge.className).toMatch(/text-yellow-800/);
  });

  it("badge priorità low è etichettato Bassa", () => {
    const s = makeSuggestion({ priority: "low" });
    render(<NbaSuggestions suggestions={[s]} />);
    expect(screen.getByText("Bassa")).toBeInTheDocument();
  });

  it("badge high ha classe CSS destructive", () => {
    const s = makeSuggestion({ priority: "high" });
    render(<NbaSuggestions suggestions={[s]} />);
    const badge = screen.getByText("Alta");
    expect(badge.className).toMatch(/destructive/);
  });

  it("badge low ha variant outline", () => {
    const s = makeSuggestion({ priority: "low" });
    render(<NbaSuggestions suggestions={[s]} />);
    const badge = screen.getByText("Bassa");
    expect(badge).toHaveAttribute("data-variant", "outline");
  });

  it("renders buttons instead of links when onAction is provided", () => {
    const s = makeSuggestion();
    render(<NbaSuggestions suggestions={[s]} onAction={() => {}} />);
    expect(screen.getByRole("button")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("calls onAction with the suggestion when button is clicked", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    const s = makeSuggestion({ type: "add_notes" });
    render(<NbaSuggestions suggestions={[s]} onAction={onAction} />);

    await user.click(screen.getByRole("button"));

    expect(onAction).toHaveBeenCalledWith(s);
  });
});
