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

import { GET, POST } from "./route";

import { getCurrentUser } from "@/lib/auth";
import { usersService } from "@/app/(dashboard)/settings/_lib/users.service";

const mockAdmin = { id: "admin-1", role: "admin", email: "admin@test.com", name: "Admin" };
const mockMember = { id: "member-1", role: "member", email: "member@test.com", name: "Member" };
const mockUsers = [
  {
    id: "user-1",
    name: "Mario",
    email: "mario@test.com",
    role: "member",
    createdAt: new Date(),
    invitedAt: null,
  },
];

describe("GET /api/settings/users", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 with users list for admin", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(mockAdmin as any);
    vi.mocked(usersService.getAllUsers).mockResolvedValue(mockUsers as any);

    const response = await GET();
    expect(response.status).toBe(200);
    const data = (await response.json()) as any[];
    expect(data).toHaveLength(1);
    expect(data[0]).toMatchObject({ id: "user-1", email: "mario@test.com", role: "member" });
  });

  it("returns 403 for member", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(mockMember as any);

    const response = await GET();
    expect(response.status).toBe(403);
  });

  it("returns 403 when not authenticated", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);

    const response = await GET();
    expect(response.status).toBe(403);
  });
});

describe("POST /api/settings/users", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function makeRequest(body: unknown) {
    return new Request("http://localhost/api/settings/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  it("returns 201 with new user for valid invite from admin", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(mockAdmin as any);
    const newUser = {
      id: "new-1",
      name: "newuser",
      email: "new@test.com",
      role: "member",
      createdAt: new Date(),
      invitedAt: new Date(),
    };
    vi.mocked(usersService.inviteUser).mockResolvedValue(newUser as any);

    const response = await POST(makeRequest({ email: "new@test.com", role: "member" }));
    expect(response.status).toBe(201);
    const data = (await response.json()) as Record<string, unknown>;
    expect(data["email"]).toBe("new@test.com");
  });

  it("returns 409 for duplicate email", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(mockAdmin as any);
    vi.mocked(usersService.inviteUser).mockRejectedValue(
      new Error("Email già registrata nel sistema"),
    );

    const response = await POST(makeRequest({ email: "mario@test.com", role: "member" }));
    expect(response.status).toBe(409);
    const data = (await response.json()) as Record<string, unknown>;
    expect(data["error"]).toBe("Email già registrata nel sistema");
  });

  it("returns 403 for member", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(mockMember as any);

    const response = await POST(makeRequest({ email: "new@test.com", role: "member" }));
    expect(response.status).toBe(403);
  });

  it("returns 400 for invalid body", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(mockAdmin as any);

    const response = await POST(makeRequest({ email: "not-an-email", role: "member" }));
    expect(response.status).toBe(400);
  });
});
