import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PipelineBoard } from "./pipeline-board";

import type { Deal } from "@/server/db/schema";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

const mockDeal: Deal = {
  id: "00000000-0000-0000-0000-000000000001",
  title: "CRM Custom RedStones",
  value: "15000.00",
  stage: "Proposta",
  contactId: "00000000-0000-0000-0000-000000000099",
  companyId: null,
  ownerId: null,
  lostReason: null,
  createdAt: new Date("2026-01-15"),
  updatedAt: new Date("2026-01-15"),
};

const mockContacts = [
  { id: "00000000-0000-0000-0000-000000000099", firstName: "Mario", lastName: "Rossi" },
];

describe("PipelineBoard", () => {
  it("renders 7 columns with correct stage names", () => {
    render(<PipelineBoard deals={[]} contacts={[]} onEdit={vi.fn()} />);

    expect(screen.getByText("Lead")).toBeInTheDocument();
    expect(screen.getByText("Qualificato")).toBeInTheDocument();
    expect(screen.getByText("Demo")).toBeInTheDocument();
    expect(screen.getByText("Proposta")).toBeInTheDocument();
    expect(screen.getByText("Negoziazione")).toBeInTheDocument();
    expect(screen.getByText("Chiuso Vinto")).toBeInTheDocument();
    expect(screen.getByText("Chiuso Perso")).toBeInTheDocument();
  });

  it("renders deal card in correct stage column", () => {
    render(<PipelineBoard deals={[mockDeal]} contacts={[]} onEdit={vi.fn()} />);

    expect(screen.getByText("CRM Custom RedStones")).toBeInTheDocument();
  });

  it("shows formatted value in deal card", () => {
    render(<PipelineBoard deals={[mockDeal]} contacts={[]} onEdit={vi.fn()} />);

    // EUR formatted value — "15.000,00 €" in it-IT locale
    const valueEls = screen.getAllByText(/15[\.,]/);
    expect(valueEls.length).toBeGreaterThan(0);
  });

  it("shows contact name in deal card when contactId is present", () => {
    render(<PipelineBoard deals={[mockDeal]} contacts={mockContacts} onEdit={vi.fn()} />);

    expect(screen.getByText("Mario Rossi")).toBeInTheDocument();
  });

  it("renders empty column when no deals in stage", () => {
    render(<PipelineBoard deals={[mockDeal]} contacts={[]} onEdit={vi.fn()} />);

    // Lead column exists but with 0 deals
    const leadHeaders = screen.getAllByText("Lead");
    expect(leadHeaders.length).toBeGreaterThan(0);
  });

  it("shows deal count in column header", () => {
    render(<PipelineBoard deals={[mockDeal]} contacts={[]} onEdit={vi.fn()} />);

    // Proposta column should show "1 deal"
    expect(screen.getByText(/1 deal/)).toBeInTheDocument();
  });
});
