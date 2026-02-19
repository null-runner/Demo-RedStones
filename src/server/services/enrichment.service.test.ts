/* eslint-disable @typescript-eslint/unbound-method */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("drizzle-orm", async (importOriginal) => {
  const actual = await importOriginal<typeof import("drizzle-orm")>();
  return {
    ...actual,
    eq: vi.fn((col: unknown, val: unknown) => ({ col, val })),
  };
});

const mockGenerateContent = vi.hoisted(() => vi.fn());
vi.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: class {
    getGenerativeModel() {
      return { generateContent: mockGenerateContent };
    }
  },
}));

import { enrichmentService } from "./enrichment.service";

import { db } from "@/server/db";

// Helper: mock DB finds a company
function mockCompanyFound(enrichmentStatus = "not_enriched") {
  const chain = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([
      {
        id: "00000000-0000-0000-0000-000000000001",
        name: "RedStones Srl",
        domain: "redstones.it",
        enrichmentStatus,
        enrichmentDescription: enrichmentStatus !== "not_enriched" ? "Desc esistente" : null,
        enrichmentSector: enrichmentStatus !== "not_enriched" ? "SaaS" : null,
        enrichmentSize: enrichmentStatus !== "not_enriched" ? "11-50" : null,
        enrichmentPainPoints: enrichmentStatus !== "not_enriched" ? "pain1\npain2" : null,
      },
    ]),
  };
  vi.mocked(db.select).mockReturnValue(chain as unknown as ReturnType<typeof db.select>);
  return chain;
}

// Helper: mock DB finds no company
function mockCompanyNotFound() {
  const chain = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
  };
  vi.mocked(db.select).mockReturnValue(chain as unknown as ReturnType<typeof db.select>);
}

// Helper: mock DB update chain
function mockDbUpdate() {
  const chain = {
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue([]),
  };
  vi.mocked(db.update).mockReturnValue(chain as unknown as ReturnType<typeof db.update>);
  return chain;
}

// Helper: mock full Gemini response
function mockGeminiSuccess(partial = false) {
  const data = partial
    ? { description: "Desc", sector: null, estimatedSize: null, painPoints: [] }
    : { description: "Desc", sector: "SaaS", estimatedSize: "11-50", painPoints: ["Pain 1"] };
  mockGenerateContent.mockResolvedValue({
    response: { text: () => JSON.stringify(data) },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  vi.stubEnv("GEMINI_API_KEY", "test-api-key");
});

describe("enrichment service — risposta completa", () => {
  it("ritorna success:true con status enriched e tutti i 4 campi", async () => {
    mockCompanyFound();
    mockDbUpdate();
    mockGeminiSuccess();

    const result = await enrichmentService.enrich("00000000-0000-0000-0000-000000000001");

    expect(result).toEqual({
      success: true,
      status: "enriched",
      data: {
        description: "Desc",
        sector: "SaaS",
        estimatedSize: "11-50",
        painPoints: ["Pain 1"],
      },
    });
  });

  it("chiama db.update con enrichmentStatus: enriched e tutti i campi", async () => {
    mockCompanyFound();
    const updateChain = mockDbUpdate();
    mockGeminiSuccess();

    await enrichmentService.enrich("00000000-0000-0000-0000-000000000001");

    expect(updateChain.set).toHaveBeenCalledWith(
      expect.objectContaining({
        enrichmentStatus: "enriched",
        enrichmentDescription: "Desc",
        enrichmentSector: "SaaS",
        enrichmentSize: "11-50",
      }),
    );
  });
});

describe("enrichment service — risposta parziale", () => {
  it("ritorna success:true con status partial quando alcuni campi sono null", async () => {
    mockCompanyFound();
    mockDbUpdate();
    mockGeminiSuccess(true);

    const result = await enrichmentService.enrich("00000000-0000-0000-0000-000000000001");

    expect(result).toEqual({
      success: true,
      status: "partial",
      data: {
        description: "Desc",
        sector: null,
        estimatedSize: null,
        painPoints: [],
      },
    });
  });

  it("chiama db.update con enrichmentStatus: partial", async () => {
    mockCompanyFound();
    const updateChain = mockDbUpdate();
    mockGeminiSuccess(true);

    await enrichmentService.enrich("00000000-0000-0000-0000-000000000001");

    expect(updateChain.set).toHaveBeenCalledWith(
      expect.objectContaining({
        enrichmentStatus: "partial",
      }),
    );
  });
});

describe("enrichment service — errori", () => {
  it("timeout: ritorna error timeout senza DB write", async () => {
    mockCompanyFound();
    const updateChain = mockDbUpdate();
    mockGenerateContent.mockRejectedValue(new Error("ENRICHMENT_TIMEOUT"));

    const result = await enrichmentService.enrich("00000000-0000-0000-0000-000000000001");

    expect(result).toEqual({ success: false, error: "timeout" });
    expect(updateChain.set).not.toHaveBeenCalled();
  });

  it("errore HTTP 503: ritorna service_unavailable senza DB write", async () => {
    mockCompanyFound();
    const updateChain = mockDbUpdate();
    mockGenerateContent.mockRejectedValue(
      new Error("GoogleGenerativeAI Error: 503 Service Unavailable"),
    );

    const result = await enrichmentService.enrich("00000000-0000-0000-0000-000000000001");

    expect(result).toEqual({ success: false, error: "service_unavailable" });
    expect(updateChain.set).not.toHaveBeenCalled();
  });

  it("errore di rete: ritorna network_error senza DB write", async () => {
    mockCompanyFound();
    const updateChain = mockDbUpdate();
    mockGenerateContent.mockRejectedValue(new TypeError("fetch failed"));

    const result = await enrichmentService.enrich("00000000-0000-0000-0000-000000000001");

    expect(result).toEqual({ success: false, error: "network_error" });
    expect(updateChain.set).not.toHaveBeenCalled();
  });

  it("companyId non trovato: ritorna not_found senza chiamare Gemini", async () => {
    mockCompanyNotFound();
    mockDbUpdate();

    const result = await enrichmentService.enrich("00000000-0000-0000-0000-000000000099");

    expect(result).toEqual({ success: false, error: "not_found" });
    expect(mockGenerateContent).not.toHaveBeenCalled();
  });
});

describe("enrichment service — force flag", () => {
  it("azienda enriched + force:false: ritorna dati esistenti senza chiamare Gemini", async () => {
    mockCompanyFound("enriched");
    mockDbUpdate();

    const result = await enrichmentService.enrich("00000000-0000-0000-0000-000000000001", {
      force: false,
    });

    expect(result).toEqual({
      success: true,
      status: "enriched",
      data: {
        description: "Desc esistente",
        sector: "SaaS",
        estimatedSize: "11-50",
        painPoints: ["pain1", "pain2"],
      },
    });
    expect(mockGenerateContent).not.toHaveBeenCalled();
  });

  it("azienda partial + force:false: ritorna dati esistenti senza chiamare Gemini", async () => {
    mockCompanyFound("partial");
    mockDbUpdate();

    const result = await enrichmentService.enrich("00000000-0000-0000-0000-000000000001", {
      force: false,
    });

    expect(result).toMatchObject({ success: true });
    expect(mockGenerateContent).not.toHaveBeenCalled();
  });

  it("azienda enriched + force:true: chiama Gemini e sovrascrive dati", async () => {
    mockCompanyFound("enriched");
    const updateChain = mockDbUpdate();
    mockGeminiSuccess();

    const result = await enrichmentService.enrich("00000000-0000-0000-0000-000000000001", {
      force: true,
    });

    expect(result).toMatchObject({ success: true, status: "enriched" });
    expect(mockGenerateContent).toHaveBeenCalledOnce();
    expect(updateChain.set).toHaveBeenCalled();
  });
});

describe("enrichment service — api_key_missing", () => {
  it("GEMINI_API_KEY mancante: ritorna api_key_missing senza chiamare Gemini", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    mockCompanyFound();
    mockDbUpdate();

    const result = await enrichmentService.enrich("00000000-0000-0000-0000-000000000001");

    expect(result).toEqual({ success: false, error: "api_key_missing" });
    expect(mockGenerateContent).not.toHaveBeenCalled();
  });
});
