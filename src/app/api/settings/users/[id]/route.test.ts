/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock("@/app/(dashboard)/settings/_lib/users.service", () => ({
  usersService: {
    getAllUsers: vi.fn(),
    inviteUser: vi.fn(),
    deleteUser: vi.fn(),
  },
}));

import { DELETE } from "./route";

import { getCurrentUser } from "@/lib/auth";
import { usersService } from "@/app/(dashboard)/settings/_lib/users.service";

const mockAdmin = { id: "admin-1", role: "admin", email: "admin@test.com", name: "Admin" };
const mockMember = { id: "member-1", role: "member", email: "member@test.com", name: "Member" };
const validUuid = "123e4567-e89b-12d3-a456-426614174000";

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("DELETE /api/settings/users/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 for valid delete by admin", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(mockAdmin as any);
    vi.mocked(usersService.deleteUser).mockResolvedValue(undefined);

    const response = await DELETE(new Request("http://localhost"), makeParams(validUuid));
    expect(response.status).toBe(200);
    const data = (await response.json()) as Record<string, unknown>;
    expect(data).toEqual({ success: true });
  });

  it("returns 403 for self-delete", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(mockAdmin as any);
    vi.mocked(usersService.deleteUser).mockRejectedValue(new Error("SELF_DELETE"));

    const response = await DELETE(new Request("http://localhost"), makeParams(validUuid));
    expect(response.status).toBe(403);
    const data = (await response.json()) as Record<string, unknown>;
    expect(data["error"]).toBe("Non puoi rimuovere il tuo account");
  });

  it("returns 400 for last admin", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(mockAdmin as any);
    vi.mocked(usersService.deleteUser).mockRejectedValue(new Error("LAST_ADMIN"));

    const response = await DELETE(new Request("http://localhost"), makeParams(validUuid));
    expect(response.status).toBe(400);
    const data = (await response.json()) as Record<string, unknown>;
    expect(data["error"]).toBe("Deve rimanere almeno un Admin nel sistema");
  });

  it("returns 403 for member", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(mockMember as any);

    const response = await DELETE(new Request("http://localhost"), makeParams(validUuid));
    expect(response.status).toBe(403);
  });

  it("returns 400 for invalid UUID format", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(mockAdmin as any);

    const response = await DELETE(new Request("http://localhost"), makeParams("not-a-uuid"));
    expect(response.status).toBe(400);
  });
});
