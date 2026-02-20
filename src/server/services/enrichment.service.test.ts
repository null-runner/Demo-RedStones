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

function mockCompanyFound(enrichmentStatus = "not_enriched") {
  const chain = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([
      {
        id: "00000000-0000-0000-0000-000000000001",
        name: "RedStones Srl",
        domain: "red-stones.it",
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

function mockCompanyNotFound() {
  const chain = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
  };
  vi.mocked(db.select).mockReturnValue(chain as unknown as ReturnType<typeof db.select>);
}

function mockDbUpdate() {
  const chain = {
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue([]),
  };
  vi.mocked(db.update).mockReturnValue(chain as unknown as ReturnType<typeof db.update>);
  return chain;
}

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

describe("startEnrichment", () => {
  it("sets processing status and returns processing result", async () => {
    mockCompanyFound();
    const updateChain = mockDbUpdate();

    const result = await enrichmentService.startEnrichment("00000000-0000-0000-0000-000000000001");

    expect(result).toEqual({ success: true, status: "processing" });
    expect(updateChain.set).toHaveBeenCalledWith(
      expect.objectContaining({ enrichmentStatus: "processing" }),
    );
  });

  it("returns existing data when already enriched and force:false", async () => {
    mockCompanyFound("enriched");

    const result = await enrichmentService.startEnrichment("00000000-0000-0000-0000-000000000001", {
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
  });

  it("returns processing when already processing and force:false", async () => {
    mockCompanyFound("processing");

    const result = await enrichmentService.startEnrichment("00000000-0000-0000-0000-000000000001");

    expect(result).toEqual({ success: true, status: "processing" });
  });

  it("sets processing when force:true even if already enriched", async () => {
    mockCompanyFound("enriched");
    const updateChain = mockDbUpdate();

    const result = await enrichmentService.startEnrichment("00000000-0000-0000-0000-000000000001", {
      force: true,
    });

    expect(result).toEqual({ success: true, status: "processing" });
    expect(updateChain.set).toHaveBeenCalledWith(
      expect.objectContaining({ enrichmentStatus: "processing" }),
    );
  });

  it("returns not_found when company does not exist", async () => {
    mockCompanyNotFound();

    const result = await enrichmentService.startEnrichment("00000000-0000-0000-0000-000000000099");

    expect(result).toEqual({ success: false, error: "not_found" });
  });

  it("returns api_key_missing when GEMINI_API_KEY is empty", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    mockCompanyFound();

    const result = await enrichmentService.startEnrichment("00000000-0000-0000-0000-000000000001");

    expect(result).toEqual({ success: false, error: "api_key_missing" });
  });
});

describe("runEnrichment — success", () => {
  it("calls Gemini and updates DB with enriched status", async () => {
    mockCompanyFound();
    const updateChain = mockDbUpdate();
    mockGeminiSuccess();

    await enrichmentService.runEnrichment("00000000-0000-0000-0000-000000000001");

    expect(mockGenerateContent).toHaveBeenCalledOnce();
    expect(updateChain.set).toHaveBeenCalledWith(
      expect.objectContaining({
        enrichmentStatus: "enriched",
        enrichmentDescription: "Desc",
        enrichmentSector: "SaaS",
        enrichmentSize: "11-50",
        enrichmentPainPoints: "Pain 1",
      }),
    );
  });

  it("sets partial status when some fields are null", async () => {
    mockCompanyFound();
    const updateChain = mockDbUpdate();
    mockGeminiSuccess(true);

    await enrichmentService.runEnrichment("00000000-0000-0000-0000-000000000001");

    expect(updateChain.set).toHaveBeenCalledWith(
      expect.objectContaining({ enrichmentStatus: "partial" }),
    );
  });
});

describe("runEnrichment — errors reset to not_enriched", () => {
  it("timeout resets status to not_enriched", async () => {
    mockCompanyFound();
    const updateChain = mockDbUpdate();
    mockGenerateContent.mockRejectedValue(new Error("ENRICHMENT_TIMEOUT"));

    await enrichmentService.runEnrichment("00000000-0000-0000-0000-000000000001");

    expect(updateChain.set).toHaveBeenCalledWith(
      expect.objectContaining({ enrichmentStatus: "not_enriched" }),
    );
  });

  it("HTTP 503 resets status to not_enriched", async () => {
    mockCompanyFound();
    const updateChain = mockDbUpdate();
    mockGenerateContent.mockRejectedValue(
      new Error("GoogleGenerativeAI Error: 503 Service Unavailable"),
    );

    await enrichmentService.runEnrichment("00000000-0000-0000-0000-000000000001");

    expect(updateChain.set).toHaveBeenCalledWith(
      expect.objectContaining({ enrichmentStatus: "not_enriched" }),
    );
  });

  it("network error resets status to not_enriched", async () => {
    mockCompanyFound();
    const updateChain = mockDbUpdate();
    mockGenerateContent.mockRejectedValue(new TypeError("fetch failed"));

    await enrichmentService.runEnrichment("00000000-0000-0000-0000-000000000001");

    expect(updateChain.set).toHaveBeenCalledWith(
      expect.objectContaining({ enrichmentStatus: "not_enriched" }),
    );
  });

  it("non-JSON Gemini response resets status to not_enriched", async () => {
    mockCompanyFound();
    const updateChain = mockDbUpdate();
    mockGenerateContent.mockResolvedValue({
      response: { text: () => "I cannot help with that request." },
    });

    await enrichmentService.runEnrichment("00000000-0000-0000-0000-000000000001");

    expect(updateChain.set).toHaveBeenCalledWith(
      expect.objectContaining({ enrichmentStatus: "not_enriched" }),
    );
  });

  it("does nothing if company not found", async () => {
    mockCompanyNotFound();
    const updateChain = mockDbUpdate();

    await enrichmentService.runEnrichment("00000000-0000-0000-0000-000000000099");

    expect(mockGenerateContent).not.toHaveBeenCalled();
    expect(updateChain.set).not.toHaveBeenCalled();
  });
});

describe("getStatus", () => {
  it("returns enrichment data when enriched", async () => {
    mockCompanyFound("enriched");

    const result = await enrichmentService.getStatus("00000000-0000-0000-0000-000000000001");

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
  });

  it("returns processing when status is processing", async () => {
    mockCompanyFound("processing");

    const result = await enrichmentService.getStatus("00000000-0000-0000-0000-000000000001");

    expect(result).toEqual({ success: true, status: "processing" });
  });

  it("returns not_found when company does not exist", async () => {
    mockCompanyNotFound();

    const result = await enrichmentService.getStatus("00000000-0000-0000-0000-000000000099");

    expect(result).toEqual({ success: false, error: "not_found" });
  });
});
