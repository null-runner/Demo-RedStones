import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { describe, expect, it, vi, beforeEach } from "vitest";

import type { CompanyWithDetails } from "../../_lib/companies.service";
import { EnrichmentSection } from "./enrichment-section";

// Mock sonner — factory must not reference outer variables (hoisting)
vi.mock("sonner", () => ({
  toast: { error: vi.fn() },
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

function makeCompany(overrides: Partial<CompanyWithDetails> = {}): CompanyWithDetails {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    name: "RedStones Srl",
    domain: "redstones.it",
    sector: null,
    description: null,
    enrichmentStatus: "not_enriched",
    enrichmentDescription: null,
    enrichmentSector: null,
    enrichmentSize: null,
    enrichmentPainPoints: null,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    contacts: [],
    deals: [],
    ...overrides,
  };
}

function mockFetchResponse(data: unknown, status = 200) {
  mockFetch.mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
  });
}

describe("EnrichmentSection", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    vi.mocked(toast.error).mockReset();
  });

  // AC1: not_enriched → bottone "Arricchisci con AI" visibile
  it("AC1: azienda not_enriched mostra bottone Arricchisci con AI", () => {
    render(<EnrichmentSection company={makeCompany()} />);

    expect(screen.getByRole("button", { name: /arricchisci con ai/i })).toBeInTheDocument();
  });

  // AC2: loading state dopo click
  it("AC2: durante loading bottone disabilitato con testo Arricchimento in corso...", async () => {
    const user = userEvent.setup();
    mockFetch.mockImplementation(() => new Promise(() => {}));

    render(<EnrichmentSection company={makeCompany()} />);
    await user.click(screen.getByRole("button", { name: /arricchisci con ai/i }));

    expect(screen.getByRole("button", { name: /arricchimento in corso/i })).toBeDisabled();
  });

  // AC3 + AC4: enrichment completo → dati + bottone "Aggiorna dati"
  it("AC3+AC4: enrichment completato mostra dati e bottone Aggiorna dati", async () => {
    const user = userEvent.setup();
    mockFetchResponse({
      success: true,
      status: "enriched",
      data: {
        description: "Azienda SaaS per PMI",
        sector: "Software",
        estimatedSize: "11-50",
        painPoints: ["Acquisizione clienti", "Retention"],
      },
    });

    render(<EnrichmentSection company={makeCompany()} />);
    await user.click(screen.getByRole("button", { name: /arricchisci con ai/i }));

    await waitFor(() => {
      expect(screen.getByText("Azienda SaaS per PMI")).toBeInTheDocument();
      expect(screen.getByText("Software")).toBeInTheDocument();
      expect(screen.getByText("11-50")).toBeInTheDocument();
      expect(screen.getByText("Acquisizione clienti")).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /aggiorna dati/i })).toBeInTheDocument();
  });

  // AC5: partial → badge "Dati parziali" + campi null mostrano "— non disponibile"
  it("AC5: enrichment partial mostra badge Dati parziali e campi mancanti", async () => {
    const user = userEvent.setup();
    mockFetchResponse({
      success: true,
      status: "partial",
      data: {
        description: "Dati parziali disponibili",
        sector: null,
        estimatedSize: null,
        painPoints: [],
      },
    });

    render(<EnrichmentSection company={makeCompany()} />);
    await user.click(screen.getByRole("button", { name: /arricchisci con ai/i }));

    await waitFor(() => {
      expect(screen.getByText("Dati parziali")).toBeInTheDocument();
      expect(screen.getByText("Dati parziali disponibili")).toBeInTheDocument();
    });
    expect(screen.getAllByText(/— non disponibile/i).length).toBeGreaterThan(0);
  });

  // AC6: errore timeout → toast con messaggio timeout
  it("AC6: errore timeout mostra toast con messaggio user-friendly", async () => {
    const user = userEvent.setup();
    mockFetchResponse({ success: false, error: "timeout" });

    render(<EnrichmentSection company={makeCompany()} />);
    await user.click(screen.getByRole("button", { name: /arricchisci con ai/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining("troppo tempo"));
    });
    expect(screen.getByRole("button", { name: /arricchisci con ai/i })).not.toBeDisabled();
  });

  // AC7: errore servizio → toast con messaggio servizio
  it("AC7: errore service_unavailable mostra toast con messaggio non tecnico", async () => {
    const user = userEvent.setup();
    mockFetchResponse({ success: false, error: "service_unavailable" });

    render(<EnrichmentSection company={makeCompany()} />);
    await user.click(screen.getByRole("button", { name: /arricchisci con ai/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining("temporaneamente non disponibile"),
      );
    });
    expect(screen.getByRole("button", { name: /arricchisci con ai/i })).not.toBeDisabled();
  });

  // AC8: azienda già enriched → bottone "Aggiorna dati"
  it("AC8: azienda enriched mostra bottone Aggiorna dati", () => {
    render(
      <EnrichmentSection
        company={makeCompany({
          enrichmentStatus: "enriched",
          enrichmentDescription: "Desc",
          enrichmentSector: "IT",
          enrichmentSize: "11-50",
          enrichmentPainPoints: "Pain point 1",
        })}
      />,
    );

    expect(screen.getByRole("button", { name: /aggiorna dati/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /arricchisci con ai/i })).not.toBeInTheDocument();
  });

  // AC9: click "Aggiorna dati" → dialog con testo conferma
  it("AC9: click Aggiorna dati apre dialog di conferma", async () => {
    const user = userEvent.setup();

    render(
      <EnrichmentSection
        company={makeCompany({ enrichmentStatus: "enriched", enrichmentDescription: "Desc" })}
      />,
    );

    await user.click(screen.getByRole("button", { name: /aggiorna dati/i }));

    expect(screen.getByText(/i dati attuali verranno sovrascritti/i)).toBeInTheDocument();
  });

  // AC10: click "Annulla" → dialog chiuso, fetch non chiamato
  it("AC10: click Annulla nel dialog chiude dialog e non chiama fetch", async () => {
    const user = userEvent.setup();

    render(
      <EnrichmentSection
        company={makeCompany({ enrichmentStatus: "enriched", enrichmentDescription: "Desc" })}
      />,
    );

    await user.click(screen.getByRole("button", { name: /aggiorna dati/i }));
    await user.click(screen.getByRole("button", { name: /annulla/i }));

    await waitFor(() => {
      expect(screen.queryByText(/i dati attuali verranno sovrascritti/i)).not.toBeInTheDocument();
    });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  // AC13: pain points con \n → lista puntata
  it("AC13: pain points con newline visualizzati come lista separata", () => {
    render(
      <EnrichmentSection
        company={makeCompany({
          enrichmentStatus: "enriched",
          enrichmentDescription: "Desc",
          enrichmentSector: "IT",
          enrichmentSize: "11-50",
          enrichmentPainPoints: "Acquisizione clienti\nRetention\nScalabilità",
        })}
      />,
    );

    expect(screen.getByText("Acquisizione clienti")).toBeInTheDocument();
    expect(screen.getByText("Retention")).toBeInTheDocument();
    expect(screen.getByText("Scalabilità")).toBeInTheDocument();
  });
});
