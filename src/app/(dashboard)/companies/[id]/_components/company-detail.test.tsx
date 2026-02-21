import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { CompanyWithDetails } from "../../_lib/companies.service";
import { CompanyDetail } from "./company-detail";

import { usePermission } from "@/hooks/use-permission";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/hooks/use-permission", () => ({
  usePermission: vi.fn(() => true),
}));

vi.mock("../../_components/company-sheet", () => ({
  CompanySheet: () => null,
}));

vi.mock("./enrichment-section", () => ({
  EnrichmentSection: () => <div data-testid="enrichment-section" />,
}));

const mockEnrichedCompany: CompanyWithDetails = {
  id: "00000000-0000-0000-0000-000000000001",
  name: "RedStones Srl",
  domain: "redstones.it",
  sector: "SaaS",
  description: "Agenzia di sviluppo software",
  address: null,
  enrichmentStatus: "enriched",
  enrichmentDescription: "Azienda specializzata in SaaS per PMI italiane",
  enrichmentSector: "Software / SaaS",
  enrichmentSize: "11-50 dipendenti",
  enrichmentPainPoints: "Acquisizione clienti\nRetention\nScalabilità",
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
  contacts: [
    { id: "c1", firstName: "Mario", lastName: "Rossi", email: "mario@redstones.it", role: "CTO" },
  ],
  deals: [{ id: "d1", title: "CRM Custom", value: "15000.00", stage: "proposal" }],
};

const mockNotEnrichedCompany: CompanyWithDetails = {
  ...mockEnrichedCompany,
  enrichmentStatus: "not_enriched",
  enrichmentDescription: null,
  enrichmentSector: null,
  enrichmentSize: null,
  enrichmentPainPoints: null,
  contacts: [],
  deals: [],
};

describe("CompanyDetail", () => {
  it("renders company info section: name, domain, sector, description", () => {
    render(<CompanyDetail company={mockEnrichedCompany} />);

    expect(screen.getAllByText("RedStones Srl")).toHaveLength(2);
    expect(screen.getByText("redstones.it")).toBeInTheDocument();
    expect(screen.getByText("SaaS")).toBeInTheDocument();
    expect(screen.getByText("Agenzia di sviluppo software")).toBeInTheDocument();
  });

  it("renders enrichment section", () => {
    render(<CompanyDetail company={mockEnrichedCompany} />);

    expect(screen.getByTestId("enrichment-section")).toBeInTheDocument();
  });

  it("renders contacts list with contact names", () => {
    render(<CompanyDetail company={mockEnrichedCompany} />);

    expect(screen.getByText("Mario Rossi")).toBeInTheDocument();
  });

  it("renders contact as link to /contacts/[id]", () => {
    render(<CompanyDetail company={mockEnrichedCompany} />);

    const link = screen.getByRole("link", { name: "Mario Rossi" });
    expect(link).toHaveAttribute("href", "/contacts/c1");
  });

  it("renders empty state when no contacts", () => {
    render(<CompanyDetail company={mockNotEnrichedCompany} />);

    expect(screen.getByText("Nessun contatto collegato")).toBeInTheDocument();
  });

  it("renders deals list with deal title, stage, and formatted value", () => {
    render(<CompanyDetail company={mockEnrichedCompany} />);

    expect(screen.getByText("CRM Custom")).toBeInTheDocument();
    expect(screen.getByText("proposal")).toBeInTheDocument();
    expect(screen.getByText(/15\.000,00/)).toBeInTheDocument();
  });

  it("renders deal as link to /deals/[id]", () => {
    render(<CompanyDetail company={mockEnrichedCompany} />);

    const link = screen.getByRole("link", { name: "CRM Custom" });
    expect(link).toHaveAttribute("href", "/deals/d1");
  });

  it("renders empty state when no deals", () => {
    render(<CompanyDetail company={mockNotEnrichedCompany} />);

    expect(screen.getByText("Nessun deal associato")).toBeInTheDocument();
  });

  it("renders back link to /companies", () => {
    render(<CompanyDetail company={mockEnrichedCompany} />);

    const backLink = screen.getByRole("link", { name: /torna alle aziende/i });
    expect(backLink).toHaveAttribute("href", "/companies");
  });

  it("renders Modifica button when user has update permission", () => {
    render(<CompanyDetail company={mockEnrichedCompany} />);

    expect(screen.getByRole("button", { name: /modifica/i })).toBeInTheDocument();
  });

  it("hides Modifica button when canWrite is false", () => {
    vi.mocked(usePermission).mockReturnValue(false);
    render(<CompanyDetail company={mockEnrichedCompany} />);

    expect(screen.queryByRole("button", { name: /modifica/i })).not.toBeInTheDocument();

    vi.mocked(usePermission).mockReturnValue(true);
  });
});
