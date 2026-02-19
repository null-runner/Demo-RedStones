import { render, screen, within } from "@testing-library/react";
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
    render(<PipelineBoard deals={[]} contacts={[]} onLostReasonNeeded={vi.fn()} />);

    expect(screen.getByText("Lead")).toBeInTheDocument();
    expect(screen.getByText("Qualificato")).toBeInTheDocument();
    expect(screen.getByText("Demo")).toBeInTheDocument();
    expect(screen.getByText("Proposta")).toBeInTheDocument();
    expect(screen.getByText("Negoziazione")).toBeInTheDocument();
    expect(screen.getByText("Chiuso Vinto")).toBeInTheDocument();
    expect(screen.getByText("Chiuso Perso")).toBeInTheDocument();
  });

  it("renders deal card in correct stage column", () => {
    render(<PipelineBoard deals={[mockDeal]} contacts={[]} onLostReasonNeeded={vi.fn()} />);

    const propostaColumn = screen.getByTestId("column-Proposta");
    expect(within(propostaColumn).getByText("CRM Custom RedStones")).toBeInTheDocument();

    const leadColumn = screen.getByTestId("column-Lead");
    expect(within(leadColumn).queryByText("CRM Custom RedStones")).not.toBeInTheDocument();
  });

  it("shows formatted value in deal card", () => {
    render(<PipelineBoard deals={[mockDeal]} contacts={[]} onLostReasonNeeded={vi.fn()} />);

    const propostaColumn = screen.getByTestId("column-Proposta");
    // EUR formatted value — card value + column header total both show "15.000,00 €"
    const valueEls = within(propostaColumn).getAllByText(/15[\.,]/);
    expect(valueEls.length).toBeGreaterThanOrEqual(1);
  });

  it("shows contact name in deal card when contactId is present", () => {
    render(
      <PipelineBoard deals={[mockDeal]} contacts={mockContacts} onLostReasonNeeded={vi.fn()} />,
    );

    expect(screen.getByText("Mario Rossi")).toBeInTheDocument();
  });

  it("renders empty column when no deals in stage", () => {
    render(<PipelineBoard deals={[mockDeal]} contacts={[]} onLostReasonNeeded={vi.fn()} />);

    const leadColumn = screen.getByTestId("column-Lead");
    expect(within(leadColumn).getByText("0 deal")).toBeInTheDocument();
  });

  it("shows deal count and total value in column header", () => {
    render(<PipelineBoard deals={[mockDeal]} contacts={[]} onLostReasonNeeded={vi.fn()} />);

    const propostaColumn = screen.getByTestId("column-Proposta");
    expect(within(propostaColumn).getByText(/1 deal/)).toBeInTheDocument();
    // Total value: card value + column header total both show "15.000,00 €"
    const valueEls = within(propostaColumn).getAllByText(/15[\.,]/);
    expect(valueEls.length).toBeGreaterThanOrEqual(2);
  });
});
