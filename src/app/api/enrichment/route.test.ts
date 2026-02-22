import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const afterCallbacks: Array<() => void | Promise<void>> = [];

vi.mock("next/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/server")>();
  return {
    ...actual,
    after: (cb: () => void | Promise<void>) => {
      afterCallbacks.push(cb);
    },
  };
});

vi.mock("@/server/services/enrichment.service", () => ({
  enrichmentService: {
    startEnrichment: vi.fn(),
    runEnrichment: vi.fn(),
    getStatus: vi.fn(),
  },
}));

vi.mock("@/lib/auth", () => ({
  getCurrentUser: vi.fn(),
}));

import { GET, POST } from "./route";

import { getCurrentUser } from "@/lib/auth";
import type { EnrichmentResult } from "@/server/services/enrichment.service";
import { enrichmentService } from "@/server/services/enrichment.service";

function makePostRequest(body: unknown) {
  return new NextRequest("http://localhost/api/enrichment", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

function makeGetRequest(companyId: string) {
  return new NextRequest(`http://localhost/api/enrichment?companyId=${companyId}`, {
    method: "GET",
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  afterCallbacks.length = 0;
  vi.mocked(getCurrentUser).mockResolvedValue({
    id: "u1",
    email: "u@t.com",
    name: "User",
    role: "admin",
  });
});

describe("POST /api/enrichment", () => {
  it("returns 401 when not authenticated", async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce(null);

    const req = makePostRequest({ companyId: "00000000-0000-0000-0000-000000000001" });
    const res = await POST(req);
    expect(res.status).toBe(401);
    expect(enrichmentService.startEnrichment).not.toHaveBeenCalled();
  });

  it("already enriched: returns 200 with data", async () => {
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
    vi.mocked(enrichmentService.startEnrichment).mockResolvedValue(mockResult);

    const req = makePostRequest({ companyId: "00000000-0000-0000-0000-000000000001" });
    const res = await POST(req);
    const body = (await res.json()) as Record<string, unknown>;

    expect(res.status).toBe(200);
    expect(body).toEqual(mockResult);
    expect(enrichmentService.startEnrichment).toHaveBeenCalledWith(
      "00000000-0000-0000-0000-000000000001",
      { force: false },
    );
  });

  it("starts processing: returns 202 and triggers background work", async () => {
    vi.mocked(enrichmentService.startEnrichment).mockResolvedValue({
      success: true,
      status: "processing",
    });
    vi.mocked(enrichmentService.runEnrichment).mockResolvedValue();

    const req = makePostRequest({ companyId: "00000000-0000-0000-0000-000000000001" });
    const res = await POST(req);
    const body = (await res.json()) as Record<string, unknown>;

    expect(res.status).toBe(202);
    expect(body).toEqual({ success: true, status: "processing" });

    // Flush after() callbacks registered during the request
    for (const cb of afterCallbacks) {
      await cb();
    }

    expect(enrichmentService.runEnrichment).toHaveBeenCalledWith(
      "00000000-0000-0000-0000-000000000001",
    );
  });

  it("force:true passes force to service", async () => {
    vi.mocked(enrichmentService.startEnrichment).mockResolvedValue({
      success: true,
      status: "processing",
    });

    const req = makePostRequest({ companyId: "00000000-0000-0000-0000-000000000001", force: true });
    await POST(req);

    expect(enrichmentService.startEnrichment).toHaveBeenCalledWith(
      "00000000-0000-0000-0000-000000000001",
      { force: true },
    );
  });

  it("invalid JSON body: returns 400", async () => {
    const req = new NextRequest("http://localhost/api/enrichment", {
      method: "POST",
      body: "not-valid-json",
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body).toHaveProperty("error", "Invalid JSON");
    expect(enrichmentService.startEnrichment).not.toHaveBeenCalled();
  });

  it("service throws: returns 500", async () => {
    vi.mocked(enrichmentService.startEnrichment).mockRejectedValue(
      new Error("DB connection failed"),
    );

    const req = makePostRequest({ companyId: "00000000-0000-0000-0000-000000000001" });
    const res = await POST(req);

    expect(res.status).toBe(500);
  });

  it("missing companyId: returns 400", async () => {
    const req = makePostRequest({});
    const res = await POST(req);

    expect(res.status).toBe(400);
    expect(enrichmentService.startEnrichment).not.toHaveBeenCalled();
  });

  it("non-uuid companyId: returns 400", async () => {
    const req = makePostRequest({ companyId: "not-a-uuid" });
    const res = await POST(req);

    expect(res.status).toBe(400);
    expect(enrichmentService.startEnrichment).not.toHaveBeenCalled();
  });

  it("service returns not_found: returns 404", async () => {
    vi.mocked(enrichmentService.startEnrichment).mockResolvedValue({
      success: false,
      error: "not_found",
    });

    const req = makePostRequest({ companyId: "00000000-0000-0000-0000-000000000099" });
    const res = await POST(req);

    expect(res.status).toBe(404);
  });

  it("service returns api_key_missing: returns 503", async () => {
    vi.mocked(enrichmentService.startEnrichment).mockResolvedValue({
      success: false,
      error: "api_key_missing",
    });

    const req = makePostRequest({ companyId: "00000000-0000-0000-0000-000000000001" });
    const res = await POST(req);

    expect(res.status).toBe(503);
  });
});

describe("GET /api/enrichment", () => {
  it("returns 401 when not authenticated", async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce(null);

    const req = makeGetRequest("00000000-0000-0000-0000-000000000001");
    const res = await GET(req);
    expect(res.status).toBe(401);
    expect(enrichmentService.getStatus).not.toHaveBeenCalled();
  });

  it("returns enrichment status for valid companyId", async () => {
    vi.mocked(enrichmentService.getStatus).mockResolvedValue({
      success: true,
      status: "enriched",
      data: {
        description: "Test",
        sector: "SaaS",
        estimatedSize: "11-50",
        painPoints: ["Pain 1"],
      },
    });

    const req = makeGetRequest("00000000-0000-0000-0000-000000000001");
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(enrichmentService.getStatus).toHaveBeenCalledWith(
      "00000000-0000-0000-0000-000000000001",
    );
  });

  it("returns processing status", async () => {
    vi.mocked(enrichmentService.getStatus).mockResolvedValue({
      success: true,
      status: "processing",
    });

    const req = makeGetRequest("00000000-0000-0000-0000-000000000001");
    const res = await GET(req);
    const body = (await res.json()) as Record<string, unknown>;

    expect(res.status).toBe(200);
    expect(body).toEqual({ success: true, status: "processing" });
  });

  it("invalid companyId: returns 400", async () => {
    const req = makeGetRequest("not-a-uuid");
    const res = await GET(req);

    expect(res.status).toBe(400);
    expect(enrichmentService.getStatus).not.toHaveBeenCalled();
  });

  it("missing companyId: returns 400", async () => {
    const req = new NextRequest("http://localhost/api/enrichment", { method: "GET" });
    const res = await GET(req);

    expect(res.status).toBe(400);
  });
});
