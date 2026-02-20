import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/services/seed.service", () => ({
  resetDatabase: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  getCurrentUser: vi.fn(),
}));

import { POST } from "./route";

import { getCurrentUser } from "@/lib/auth";
import { resetDatabase } from "@/server/services/seed.service";

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getCurrentUser).mockResolvedValue({
    id: "g1",
    email: "g@t.com",
    name: "Guest",
    role: "guest",
  });
});

describe("POST /api/seed/reset", () => {
  it("returns 403 when user is not authenticated", async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce(null);

    const response = await POST();
    expect(response.status).toBe(403);
    expect(resetDatabase).not.toHaveBeenCalled();
  });

  it("returns 403 when user role is member", async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce({
      id: "m1",
      email: "m@t.com",
      name: "Member",
      role: "member",
    });

    const response = await POST();
    expect(response.status).toBe(403);
  });

  it("returns 200 with success:true when reset succeeds", async () => {
    vi.mocked(resetDatabase).mockResolvedValueOnce(undefined);

    const response = await POST();
    const body = (await response.json()) as Record<string, unknown>;

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
