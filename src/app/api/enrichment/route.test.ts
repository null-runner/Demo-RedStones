import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/services/enrichment.service", () => ({
  enrichmentService: {
    enrich: vi.fn(),
  },
}));

import { POST } from "./route";

import type { EnrichmentResult } from "@/server/services/enrichment.service";
import { enrichmentService } from "@/server/services/enrichment.service";

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/enrichment", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/enrichment", () => {
  it("body valido con companyId: chiama service e ritorna 200 con dati", async () => {
    const mockResult: EnrichmentResult = {
      success: true,
      status: "enriched",
      data: {
        description: "Test company",
        sector: "SaaS",
        estimatedSize: "11-50",
        painPoints: ["Pain 1"],
      },
    };
    vi.mocked(enrichmentService.enrich).mockResolvedValue(mockResult);

    const req = makeRequest({ companyId: "00000000-0000-0000-0000-000000000001" });
    const res = await POST(req);
    const body = (await res.json()) as Record<string, unknown>;

    expect(res.status).toBe(200);
    expect(body).toEqual(mockResult);
    expect(enrichmentService.enrich).toHaveBeenCalledWith("00000000-0000-0000-0000-000000000001", {
      force: false,
    });
  });

  it("body valido con force:true: passa force al service", async () => {
    const mockResult: EnrichmentResult = {
      success: true,
      status: "enriched",
      data: { description: "Desc", sector: "SaaS", estimatedSize: "11-50", painPoints: [] },
    };
    vi.mocked(enrichmentService.enrich).mockResolvedValue(mockResult);

    const req = makeRequest({ companyId: "00000000-0000-0000-0000-000000000001", force: true });
    await POST(req);

    expect(enrichmentService.enrich).toHaveBeenCalledWith("00000000-0000-0000-0000-000000000001", {
      force: true,
    });
  });

  it("body senza companyId: ritorna 400", async () => {
    const req = makeRequest({});
    const res = await POST(req);

    expect(res.status).toBe(400);
    expect(enrichmentService.enrich).not.toHaveBeenCalled();
  });

  it("companyId non-uuid: ritorna 400", async () => {
    const req = makeRequest({ companyId: "not-a-uuid" });
    const res = await POST(req);

    expect(res.status).toBe(400);
    expect(enrichmentService.enrich).not.toHaveBeenCalled();
  });

  it("service ritorna not_found: route ritorna 404", async () => {
    const mockResult: EnrichmentResult = { success: false, error: "not_found" };
    vi.mocked(enrichmentService.enrich).mockResolvedValue(mockResult);

    const req = makeRequest({ companyId: "00000000-0000-0000-0000-000000000099" });
    const res = await POST(req);

    expect(res.status).toBe(404);
  });

  it("service ritorna timeout: route ritorna 504", async () => {
    const mockResult: EnrichmentResult = { success: false, error: "timeout" };
    vi.mocked(enrichmentService.enrich).mockResolvedValue(mockResult);

    const req = makeRequest({ companyId: "00000000-0000-0000-0000-000000000001" });
    const res = await POST(req);

    expect(res.status).toBe(504);
  });

  it("service ritorna service_unavailable: route ritorna 503", async () => {
    const mockResult: EnrichmentResult = { success: false, error: "service_unavailable" };
    vi.mocked(enrichmentService.enrich).mockResolvedValue(mockResult);

    const req = makeRequest({ companyId: "00000000-0000-0000-0000-000000000001" });
    const res = await POST(req);

    expect(res.status).toBe(503);
  });

  it("service ritorna api_key_missing: route ritorna 503", async () => {
    const mockResult: EnrichmentResult = { success: false, error: "api_key_missing" };
    vi.mocked(enrichmentService.enrich).mockResolvedValue(mockResult);

    const req = makeRequest({ companyId: "00000000-0000-0000-0000-000000000001" });
    const res = await POST(req);

    expect(res.status).toBe(503);
  });

  it("service ritorna network_error: route ritorna 503", async () => {
    const mockResult: EnrichmentResult = { success: false, error: "network_error" };
    vi.mocked(enrichmentService.enrich).mockResolvedValue(mockResult);

    const req = makeRequest({ companyId: "00000000-0000-0000-0000-000000000001" });
    const res = await POST(req);

    expect(res.status).toBe(503);
  });
});
