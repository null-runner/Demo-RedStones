import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { CompanyWithDetails } from "../../_lib/companies.service";
import { CompanyDetail } from "./company-detail";

const mockEnrichedCompany: CompanyWithDetails = {
  id: "00000000-0000-0000-0000-000000000001",
  name: "RedStones Srl",
  domain: "redstones.it",
  sector: "SaaS",
  description: "Agenzia di sviluppo software",
  enrichmentStatus: "enriched",
  enrichmentDescription: "Azienda specializzata in SaaS per PMI italiane",
  enrichmentSector: "Software / SaaS",
  enrichmentSize: "11-50 dipendenti",
  enrichmentPainPoints: "Acquisizione clienti, retention, scalabilità",
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

const mockPartialCompany: CompanyWithDetails = {
  ...mockEnrichedCompany,
  enrichmentStatus: "partial",
  enrichmentDescription: "Dati parziali disponibili",
  enrichmentSector: null,
  enrichmentSize: null,
  enrichmentPainPoints: null,
  contacts: [],
  deals: [],
};

describe("CompanyDetail", () => {
  it("renders company info section: name, domain, sector, description", () => {
    render(<CompanyDetail company={mockEnrichedCompany} />);

    expect(screen.getByText("RedStones Srl")).toBeInTheDocument();
    expect(screen.getByText("redstones.it")).toBeInTheDocument();
    expect(screen.getByText("SaaS")).toBeInTheDocument();
    expect(screen.getByText("Agenzia di sviluppo software")).toBeInTheDocument();
  });

  it("renders enrichment section with all 4 fields when enriched", () => {
    render(<CompanyDetail company={mockEnrichedCompany} />);

    expect(screen.getByText("Azienda specializzata in SaaS per PMI italiane")).toBeInTheDocument();
    expect(screen.getByText("Software / SaaS")).toBeInTheDocument();
    expect(screen.getByText("11-50 dipendenti")).toBeInTheDocument();
    expect(screen.getByText("Acquisizione clienti, retention, scalabilità")).toBeInTheDocument();
  });

  it("renders enrichment empty state with CTA when not enriched", () => {
    render(<CompanyDetail company={mockNotEnrichedCompany} />);

    expect(screen.getByText("Arricchisci con AI")).toBeInTheDocument();
  });

  it("renders partial enrichment badge when partial", () => {
    render(<CompanyDetail company={mockPartialCompany} />);

    expect(screen.getByText("Parzialmente arricchita")).toBeInTheDocument();
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

  it("renders deals list with deal title and stage", () => {
    render(<CompanyDetail company={mockEnrichedCompany} />);

    expect(screen.getByText("CRM Custom")).toBeInTheDocument();
    expect(screen.getByText("proposal")).toBeInTheDocument();
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
});
