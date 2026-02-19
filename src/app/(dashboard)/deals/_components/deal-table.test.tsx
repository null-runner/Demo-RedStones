import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { DealTable } from "./deal-table";

import type { Deal } from "@/server/db/schema";

const mockDeal: Deal = {
  id: "00000000-0000-0000-0000-000000000001",
  title: "CRM Custom RedStones",
  value: "15000.00",
  stage: "Proposta",
  contactId: null,
  companyId: null,
  ownerId: null,
  lostReason: null,
  createdAt: new Date("2026-01-15"),
  updatedAt: new Date("2026-01-15"),
};

describe("DealTable", () => {
  it("renders deal title", () => {
    render(<DealTable deals={[mockDeal]} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText("CRM Custom RedStones")).toBeInTheDocument();
  });

  it("renders deal stage as badge", () => {
    render(<DealTable deals={[mockDeal]} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText("Proposta")).toBeInTheDocument();
  });

  it("renders formatted deal value", () => {
    render(<DealTable deals={[mockDeal]} onEdit={vi.fn()} onDelete={vi.fn()} />);
    const valueCell = screen.getByText(/15\.000|15,000|€/);
    expect(valueCell).toBeInTheDocument();
  });

  it("renders empty state when no deals", () => {
    render(<DealTable deals={[]} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText(/nessun deal/i)).toBeInTheDocument();
  });

  it("calls onEdit when edit button clicked", async () => {
    const onEdit = vi.fn();
    const user = userEvent.setup();
    render(<DealTable deals={[mockDeal]} onEdit={onEdit} onDelete={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /modifica/i }));

    expect(onEdit).toHaveBeenCalledWith(mockDeal);
  });

  it("calls onDelete when delete button clicked", async () => {
    const onDelete = vi.fn();
    const user = userEvent.setup();
    render(<DealTable deals={[mockDeal]} onEdit={vi.fn()} onDelete={onDelete} />);

    await user.click(screen.getByRole("button", { name: /elimina/i }));

    expect(onDelete).toHaveBeenCalledWith(mockDeal.id);
  });
});
