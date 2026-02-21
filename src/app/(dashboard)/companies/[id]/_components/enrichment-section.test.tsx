import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { describe, expect, it, vi, beforeEach } from "vitest";

import type { CompanyWithDetails } from "../../_lib/companies.service";
import { EnrichmentSection } from "./enrichment-section";

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

const mockUpdateEnrichment = vi.fn();
vi.mock("../../_lib/companies.actions", () => ({
  updateEnrichment: (...args: unknown[]) => mockUpdateEnrichment(...args) as unknown,
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

function makeCompany(overrides: Partial<CompanyWithDetails> = {}): CompanyWithDetails {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    name: "RedStones Srl",
    domain: "redstones.it",
    sector: null,
    description: null,
    address: null,
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
    mockUpdateEnrichment.mockReset();
    vi.mocked(toast.error).mockReset();
    vi.mocked(toast.success).mockReset();
  });

  it("azienda not_enriched mostra bottone Arricchisci con AI", () => {
    render(<EnrichmentSection company={makeCompany()} />);

    expect(screen.getByRole("button", { name: /arricchisci con ai/i })).toBeInTheDocument();
  });

  it("durante loading bottone disabilitato con testo Arricchimento in corso...", async () => {
    const user = userEvent.setup();
    mockFetch.mockImplementation(() => new Promise(() => {}));

    render(<EnrichmentSection company={makeCompany()} />);
    await user.click(screen.getByRole("button", { name: /arricchisci con ai/i }));

    expect(screen.getByRole("button", { name: /arricchimento in corso/i })).toBeDisabled();
  });

  it("enrichment completato mostra dati e bottone Rigenera con AI", async () => {
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
    expect(screen.getByRole("button", { name: /rigenera con ai/i })).toBeInTheDocument();
  });

  it("enrichment partial mostra badge Dati parziali e campi mancanti", async () => {
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

  it("errore dal server mostra toast con messaggio user-friendly", async () => {
    const user = userEvent.setup();
    mockFetchResponse({ success: false, error: "api_key_missing" });

    render(<EnrichmentSection company={makeCompany()} />);
    await user.click(screen.getByRole("button", { name: /arricchisci con ai/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining("temporaneamente non disponibile"),
      );
    });
    expect(screen.getByRole("button", { name: /arricchisci con ai/i })).not.toBeDisabled();
  });

  it("errore service_unavailable mostra toast con messaggio non tecnico", async () => {
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

  it("azienda enriched mostra bottone Rigenera con AI", () => {
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

    expect(screen.getByRole("button", { name: /rigenera con ai/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /arricchisci con ai/i })).not.toBeInTheDocument();
  });

  it("click Rigenera con AI apre dialog di conferma", async () => {
    const user = userEvent.setup();

    render(
      <EnrichmentSection
        company={makeCompany({ enrichmentStatus: "enriched", enrichmentDescription: "Desc" })}
      />,
    );

    await user.click(screen.getByRole("button", { name: /rigenera con ai/i }));

    expect(screen.getByText(/i dati attuali verranno sovrascritti/i)).toBeInTheDocument();
  });

  it("click Annulla nel dialog chiude dialog e non chiama fetch", async () => {
    const user = userEvent.setup();

    render(
      <EnrichmentSection
        company={makeCompany({ enrichmentStatus: "enriched", enrichmentDescription: "Desc" })}
      />,
    );

    await user.click(screen.getByRole("button", { name: /rigenera con ai/i }));
    await user.click(screen.getByRole("button", { name: /annulla/i }));

    await waitFor(() => {
      expect(screen.queryByText(/i dati attuali verranno sovrascritti/i)).not.toBeInTheDocument();
    });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("click Rigenera nel dialog chiama fetch con force:true", async () => {
    const user = userEvent.setup();
    mockFetchResponse({
      success: true,
      status: "enriched",
      data: {
        description: "Updated",
        sector: "IT",
        estimatedSize: "11-50",
        painPoints: ["New pain"],
      },
    });

    render(
      <EnrichmentSection
        company={makeCompany({
          enrichmentStatus: "enriched",
          enrichmentDescription: "Desc",
          enrichmentSector: "IT",
          enrichmentSize: "11-50",
          enrichmentPainPoints: "Old pain",
        })}
      />,
    );

    await user.click(screen.getByRole("button", { name: /rigenera con ai/i }));
    await user.click(screen.getByRole("button", { name: /^rigenera$/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/enrichment",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            companyId: "00000000-0000-0000-0000-000000000001",
            force: true,
          }),
        }),
      );
    });
  });

  it("azienda enriched non chiama fetch al mount", () => {
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

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("pain points con newline visualizzati come lista separata", () => {
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

  it("errore di rete (fetch throws) mostra toast servizio non disponibile", async () => {
    const user = userEvent.setup();
    mockFetch.mockRejectedValue(new Error("Failed to fetch"));

    render(<EnrichmentSection company={makeCompany()} />);
    await user.click(screen.getByRole("button", { name: /arricchisci con ai/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining("temporaneamente non disponibile"),
      );
    });
    expect(screen.getByRole("button", { name: /arricchisci con ai/i })).not.toBeDisabled();
  });

  it("bottone Modifica visibile quando enriched", () => {
    render(
      <EnrichmentSection
        company={makeCompany({
          enrichmentStatus: "enriched",
          enrichmentDescription: "Desc",
          enrichmentSector: "IT",
          enrichmentSize: "11-50",
          enrichmentPainPoints: "Pain 1",
        })}
      />,
    );

    expect(screen.getByRole("button", { name: /modifica/i })).toBeInTheDocument();
  });

  it("bottone Modifica non visibile quando not_enriched", () => {
    render(<EnrichmentSection company={makeCompany()} />);

    expect(screen.queryByRole("button", { name: /modifica/i })).not.toBeInTheDocument();
  });

  it("click Modifica mostra form con valori pre-compilati", async () => {
    const user = userEvent.setup();
    render(
      <EnrichmentSection
        company={makeCompany({
          enrichmentStatus: "enriched",
          enrichmentDescription: "Agenzia digitale",
          enrichmentSector: "SaaS",
          enrichmentSize: "11-50",
          enrichmentPainPoints: "Scaling\nProcessi manuali",
        })}
      />,
    );

    await user.click(screen.getByRole("button", { name: /modifica/i }));

    expect(screen.getByLabelText(/descrizione/i)).toHaveValue("Agenzia digitale");
    expect(screen.getByLabelText(/settore/i)).toHaveValue("SaaS");
    expect(screen.getByLabelText(/pain points/i)).toHaveValue("Scaling\nProcessi manuali");
  });

  it("click Annulla chiude form senza chiamare action", async () => {
    const user = userEvent.setup();
    render(
      <EnrichmentSection
        company={makeCompany({
          enrichmentStatus: "enriched",
          enrichmentDescription: "Desc",
          enrichmentSector: "IT",
          enrichmentSize: "11-50",
          enrichmentPainPoints: "Pain 1",
        })}
      />,
    );

    await user.click(screen.getByRole("button", { name: /modifica/i }));
    await user.click(screen.getByRole("button", { name: /annulla/i }));

    expect(screen.queryByLabelText(/descrizione/i)).not.toBeInTheDocument();
    expect(mockUpdateEnrichment).not.toHaveBeenCalled();
  });

  it("click Salva chiama updateEnrichment e aggiorna display", async () => {
    const user = userEvent.setup();
    mockUpdateEnrichment.mockResolvedValue({
      success: true,
      data: {
        ...makeCompany(),
        enrichmentStatus: "enriched",
        enrichmentDescription: "Nuova desc",
        enrichmentSector: "SaaS",
        enrichmentSize: "11-50",
        enrichmentPainPoints: "Pain aggiornato",
      },
    });

    render(
      <EnrichmentSection
        company={makeCompany({
          enrichmentStatus: "enriched",
          enrichmentDescription: "Vecchia desc",
          enrichmentSector: "IT",
          enrichmentSize: "11-50",
          enrichmentPainPoints: "Pain 1",
        })}
      />,
    );

    await user.click(screen.getByRole("button", { name: /modifica/i }));
    const descField = screen.getByLabelText(/descrizione/i);
    await user.clear(descField);
    await user.type(descField, "Nuova desc");
    await user.click(screen.getByRole("button", { name: /salva/i }));

    await waitFor(() => {
      expect(mockUpdateEnrichment).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "00000000-0000-0000-0000-000000000001",
          enrichmentDescription: "Nuova desc",
        }),
      );
    });
    await waitFor(() => {
      expect(screen.getByText("Nuova desc")).toBeInTheDocument();
    });
    expect(toast.success).toHaveBeenCalledWith("Dati enrichment aggiornati");
  });
});
