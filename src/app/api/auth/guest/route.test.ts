import { describe, expect, it, vi } from "vitest";

// Mock server-only to prevent Next.js server boundary error in tests
vi.mock("server-only", () => ({}));

// Mock the seed service
vi.mock("@/server/services/seed.service", () => ({
  resetDatabase: vi.fn(),
}));

import { POST } from "./route";

import { resetDatabase } from "@/server/services/seed.service";

describe("POST /api/auth/guest", () => {
  it("calls resetDatabase and returns 200 with success:true", async () => {
    vi.mocked(resetDatabase).mockResolvedValueOnce(undefined);

    const response = await POST();
    const body = (await response.json()) as Record<string, unknown>;

    expect(resetDatabase).toHaveBeenCalledOnce();
    expect(response.status).toBe(200);
    expect(body).toEqual({ success: true });
  });

  it("returns 500 with success:false when resetDatabase throws", async () => {
    vi.mocked(resetDatabase).mockRejectedValueOnce(new Error("DB error"));

    const response = await POST();
    const body = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(500);
    expect(body).toMatchObject({ success: false });
  });
});
