import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StagnantDealsList } from "./stagnant-deals-list";
import type { StagnantDeal } from "../_lib/dashboard.service";

const mockDeals: StagnantDeal[] = [
  { id: "uuid-1", title: "Deal Alpha", stage: "Proposta", daysInactive: 20, value: 15000 },
  { id: "uuid-2", title: "Deal Beta", stage: "Demo", daysInactive: 35, value: 8000 },
];

describe("StagnantDealsList", () => {
  it("shows empty state when no stagnant deals", () => {
    render(<StagnantDealsList deals={[]} />);
    expect(screen.getByText("Nessun deal stagnante — ottimo lavoro!")).toBeInTheDocument();
  });

  it("renders title, stage, and days for each deal", () => {
    render(<StagnantDealsList deals={mockDeals} />);
    expect(screen.getByText("Deal Alpha")).toBeInTheDocument();
    expect(screen.getByText("Deal Beta")).toBeInTheDocument();
    expect(screen.getByText("Proposta")).toBeInTheDocument();
    expect(screen.getByText("Demo")).toBeInTheDocument();
  });

  it("renders daysInactive as 'X giorni' text", () => {
    render(<StagnantDealsList deals={mockDeals} />);
    expect(screen.getByText("20 giorni")).toBeInTheDocument();
    expect(screen.getByText("35 giorni")).toBeInTheDocument();
  });

  it("renders formatted EUR value for each deal", () => {
    render(<StagnantDealsList deals={mockDeals} />);
    // formatEUR uses Intl which inserts narrow no-break space (\u202f) before €
    expect(screen.getByText(/15\.000,00/)).toBeInTheDocument();
    expect(screen.getByText(/8\.?000,00/)).toBeInTheDocument();
  });

  it("renders a link to /deals/[id] for each deal", () => {
    render(<StagnantDealsList deals={mockDeals} />);
    const link1 = screen.getByRole("link", { name: /Deal Alpha/i });
    const link2 = screen.getByRole("link", { name: /Deal Beta/i });
    expect(link1).toHaveAttribute("href", "/deals/uuid-1");
    expect(link2).toHaveAttribute("href", "/deals/uuid-2");
  });
});
