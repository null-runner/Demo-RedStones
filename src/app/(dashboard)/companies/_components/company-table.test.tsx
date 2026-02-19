import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { CompanyTable } from "./company-table";

import type { Company } from "@/server/db/schema";

const makeCompany = (overrides: Partial<Company> = {}): Company => ({
  id: "00000000-0000-0000-0000-000000000001",
  name: "RedStones Srl",
  domain: "redstones.it",
  sector: "SaaS",
  description: "Agenzia SaaS",
  enrichmentDescription: null,
  enrichmentSector: null,
  enrichmentSize: null,
  enrichmentPainPoints: null,
  enrichmentStatus: "not_enriched" as const,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
  ...overrides,
});

const mockCompanies = [
  makeCompany({
    id: "00000000-0000-0000-0000-000000000001",
    name: "RedStones Srl",
    domain: "redstones.it",
    sector: "SaaS",
    enrichmentStatus: "not_enriched",
  }),
  makeCompany({
    id: "00000000-0000-0000-0000-000000000002",
    name: "Acme Corp",
    domain: null,
    sector: null,
    enrichmentStatus: "enriched",
  }),
  makeCompany({
    id: "00000000-0000-0000-0000-000000000003",
    name: "Beta Srl",
    domain: "beta.it",
    sector: "Retail",
    enrichmentStatus: "partial",
  }),
];

describe("CompanyTable", () => {
  it("renders column headers: Nome, Dominio, Settore, Arricchimento, Azioni", () => {
    render(<CompanyTable companies={mockCompanies} onEdit={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByText("Nome")).toBeInTheDocument();
    expect(screen.getByText("Dominio")).toBeInTheDocument();
    expect(screen.getByText("Settore")).toBeInTheDocument();
    expect(screen.getByText("Arricchimento")).toBeInTheDocument();
    expect(screen.getByText("Azioni")).toBeInTheDocument();
  });

  it("renders company rows with name, domain, sector", () => {
    render(<CompanyTable companies={mockCompanies} onEdit={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByText("RedStones Srl")).toBeInTheDocument();
    expect(screen.getByText("redstones.it")).toBeInTheDocument();
    expect(screen.getByText("SaaS")).toBeInTheDocument();
  });

  it("renders enrichment badge 'Enriched' for enriched company", () => {
    const companies = [makeCompany({ enrichmentStatus: "enriched" })];
    render(<CompanyTable companies={companies} onEdit={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByText("Enriched")).toBeInTheDocument();
  });

  it("renders enrichment badge 'Not enriched' for not_enriched company", () => {
    const companies = [makeCompany({ enrichmentStatus: "not_enriched" })];
    render(<CompanyTable companies={companies} onEdit={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByText("Not enriched")).toBeInTheDocument();
  });

  it("renders enrichment badge 'Partial' for partial company", () => {
    const companies = [makeCompany({ enrichmentStatus: "partial" })];
    render(<CompanyTable companies={companies} onEdit={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByText("Partial")).toBeInTheDocument();
  });

  it("shows dash when domain is null", () => {
    const companies = [makeCompany({ domain: null })];
    render(<CompanyTable companies={companies} onEdit={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("calls onEdit when edit button clicked", async () => {
    const onEdit = vi.fn();
    const user = userEvent.setup();
    const companies = [makeCompany()];
    render(<CompanyTable companies={companies} onEdit={onEdit} onDelete={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /modifica redstones srl/i }));

    expect(onEdit).toHaveBeenCalledWith(companies[0]);
  });

  it("calls onDelete when delete button clicked", async () => {
    const onDelete = vi.fn();
    const user = userEvent.setup();
    const companies = [makeCompany()];
    render(<CompanyTable companies={companies} onEdit={vi.fn()} onDelete={onDelete} />);

    await user.click(screen.getByRole("button", { name: /elimina redstones srl/i }));

    expect(onDelete).toHaveBeenCalledWith("00000000-0000-0000-0000-000000000001");
  });

  it("renders empty state when companies array is empty", () => {
    render(<CompanyTable companies={[]} onEdit={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByText("Nessuna azienda trovata")).toBeInTheDocument();
  });

  it("renders company name as clickable button when onViewDetail provided", () => {
    const companies = [makeCompany()];
    render(
      <CompanyTable
        companies={companies}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onViewDetail={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "RedStones Srl" })).toBeInTheDocument();
  });

  it("calls onViewDetail when company name clicked", async () => {
    const onViewDetail = vi.fn();
    const user = userEvent.setup();
    const companies = [makeCompany()];
    render(
      <CompanyTable
        companies={companies}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onViewDetail={onViewDetail}
      />,
    );

    await user.click(screen.getByRole("button", { name: "RedStones Srl" }));

    expect(onViewDetail).toHaveBeenCalledWith("00000000-0000-0000-0000-000000000001");
  });

  it("renders company name as plain text when onViewDetail not provided", () => {
    const companies = [makeCompany()];
    render(<CompanyTable companies={companies} onEdit={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.queryByRole("button", { name: "RedStones Srl" })).not.toBeInTheDocument();
    expect(screen.getByText("RedStones Srl")).toBeInTheDocument();
  });
});
