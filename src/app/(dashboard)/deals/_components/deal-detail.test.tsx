import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DealDetail } from "./deal-detail";
import type { DealWithDetails } from "../_lib/deals.service";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("../_lib/timeline.actions", () => ({
  addNote: vi.fn().mockResolvedValue({ success: true, data: {} }),
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

const mockDeal: DealWithDetails = {
  id: "00000000-0000-0000-0000-000000000001",
  title: "CRM Custom RedStones",
  value: "15000.00",
  stage: "Proposta",
  contactId: "00000000-0000-0000-0000-000000000099",
  companyId: "00000000-0000-0000-0000-000000000088",
  ownerId: "00000000-0000-0000-0000-000000000077",
  lostReason: null,
  createdAt: new Date("2026-01-15"),
  updatedAt: new Date("2026-01-15"),
  contact: {
    id: "00000000-0000-0000-0000-000000000099",
    firstName: "Mario",
    lastName: "Rossi",
    email: "mario@example.com",
  },
  company: { id: "00000000-0000-0000-0000-000000000088", name: "RedStones" },
  owner: { id: "00000000-0000-0000-0000-000000000077", name: "Jacopo Rampinelli" },
};

const mockLostDeal: DealWithDetails = {
  ...mockDeal,
  id: "00000000-0000-0000-0000-000000000002",
  stage: "Chiuso Perso",
  lostReason: "Prezzo troppo alto",
};

const baseProps = {
  deal: mockDeal,
  companies: [{ id: "c1", name: "Test" }],
  contacts: [{ id: "ct1", firstName: "A", lastName: "B" }],
  users: [{ id: "u1", name: "Admin" }],
  timelineEntries: [],
};

describe("DealDetail", () => {
  it("renders deal title and stage", () => {
    render(<DealDetail {...baseProps} />);

    expect(screen.getByText("CRM Custom RedStones")).toBeInTheDocument();
    expect(screen.getByText("Proposta")).toBeInTheDocument();
  });

  it("renders formatted EUR value", () => {
    render(<DealDetail {...baseProps} />);

    // EUR formatted: "15.000,00 €" or "€15,000.00" depending on locale
    expect(screen.getByText(/15[\.\,]000/)).toBeInTheDocument();
  });

  it("renders contact name when present", () => {
    render(<DealDetail {...baseProps} />);

    expect(screen.getByText("Mario Rossi")).toBeInTheDocument();
  });

  it("renders company name when present", () => {
    render(<DealDetail {...baseProps} />);

    expect(screen.getByText("RedStones")).toBeInTheDocument();
  });

  it("renders owner name when present", () => {
    render(<DealDetail {...baseProps} />);

    expect(screen.getByText("Jacopo Rampinelli")).toBeInTheDocument();
  });

  it("shows lost reason when deal is Chiuso Perso", () => {
    render(<DealDetail {...baseProps} deal={mockLostDeal} />);

    expect(screen.getByText("Prezzo troppo alto")).toBeInTheDocument();
  });

  it("does not show lost reason section when deal is not Chiuso Perso", () => {
    render(<DealDetail {...baseProps} />);

    expect(screen.queryByText("Motivo perdita")).not.toBeInTheDocument();
  });

  it("renders NBA placeholder section", () => {
    render(<DealDetail {...baseProps} />);

    expect(screen.getByText("Prossima Azione Suggerita")).toBeInTheDocument();
  });

  it("renders timeline section with add note form", () => {
    render(<DealDetail {...baseProps} />);

    expect(screen.getByText("Timeline Attività")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/nota/i)).toBeInTheDocument();
    expect(screen.getByText(/nessuna attività/i)).toBeInTheDocument();
  });
});
