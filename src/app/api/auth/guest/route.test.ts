import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock("@/server/services/seed.service", () => ({
  resetDatabase: vi.fn(),
}));

import { POST } from "./route";

import { getCurrentUser } from "@/lib/auth";
import { resetDatabase } from "@/server/services/seed.service";

const mockGetCurrentUser = vi.mocked(getCurrentUser);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/auth/guest", () => {
  it("returns 401 when user is not authenticated", async () => {
    mockGetCurrentUser.mockResolvedValueOnce(null);

    const response = await POST();
    const body = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(401);
    expect(body).toMatchObject({ success: false, error: "Unauthorized" });
    expect(resetDatabase).not.toHaveBeenCalled();
  });

  it("returns 401 when user role is member", async () => {
    mockGetCurrentUser.mockResolvedValueOnce({
      id: "1",
      email: "member@test.com",
      name: "Member",
      role: "member",
    });

    const response = await POST();
    const body = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(401);
    expect(body).toMatchObject({ success: false, error: "Unauthorized" });
    expect(resetDatabase).not.toHaveBeenCalled();
  });

  it("calls resetDatabase and returns 200 when user is guest", async () => {
    mockGetCurrentUser.mockResolvedValueOnce({
      id: "2",
      email: "guest@demo.redstones.local",
      name: "Guest",
      role: "guest",
    });
    vi.mocked(resetDatabase).mockResolvedValueOnce(undefined);

    const response = await POST();
    const body = (await response.json()) as Record<string, unknown>;

    expect(resetDatabase).toHaveBeenCalledOnce();
    expect(response.status).toBe(200);
    expect(body).toEqual({ success: true });
  });

  it("calls resetDatabase and returns 200 when user is admin", async () => {
    mockGetCurrentUser.mockResolvedValueOnce({
      id: "3",
      email: "admin@test.com",
      name: "Admin",
      role: "admin",
    });
    vi.mocked(resetDatabase).mockResolvedValueOnce(undefined);

    const response = await POST();
    const body = (await response.json()) as Record<string, unknown>;

    expect(resetDatabase).toHaveBeenCalledOnce();
    expect(response.status).toBe(200);
    expect(body).toEqual({ success: true });
  });

  it("returns 500 with success:false when resetDatabase throws", async () => {
    mockGetCurrentUser.mockResolvedValueOnce({
      id: "2",
      email: "guest@demo.redstones.local",
      name: "Guest",
      role: "guest",
    });
    vi.mocked(resetDatabase).mockRejectedValueOnce(new Error("DB error"));

    const response = await POST();
    const body = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(500);
    expect(body).toMatchObject({ success: false });
  });
});
