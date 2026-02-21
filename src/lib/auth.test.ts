import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/auth", () => ({
  auth: vi.fn(),
}));

import { getCurrentUser, requireRole, RBACError } from "./auth";

import { auth } from "@/server/auth";

type MockSession = {
  user: { id: string; email: string; name: string; role: string };
  expires: string;
} | null;

// Cast: auth() returns Session in app context; mock returns a simpler shape for testing
const mockAuth = vi.mocked(auth) as unknown as { mockResolvedValue: (v: MockSession) => void };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("requireRole", () => {
  it("throws RBACError when user is not authenticated (null)", async () => {
    mockAuth.mockResolvedValue(null);
    await expect(requireRole(["admin"])).rejects.toBeInstanceOf(RBACError);
  });

  it("returns user when admin calls requireRole(['admin'])", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "1", email: "admin@test.com", name: "Admin", role: "admin" },
      expires: "",
    });
    await expect(requireRole(["admin"])).resolves.toMatchObject({
      id: "1",
      role: "admin",
    });
  });

  it("throws RBACError when member calls requireRole(['admin'])", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "2", email: "member@test.com", name: "Member", role: "member" },
      expires: "",
    });
    await expect(requireRole(["admin"])).rejects.toBeInstanceOf(RBACError);
  });

  it("throws RBACError when guest calls requireRole(['admin', 'member'])", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "3", email: "guest@test.com", name: "Guest", role: "guest" },
      expires: "",
    });
    await expect(requireRole(["admin", "member"])).rejects.toBeInstanceOf(RBACError);
  });

  it("RBACError has statusCode 403", async () => {
    mockAuth.mockResolvedValue(null);
    const error = await requireRole(["admin"]).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(RBACError);
    expect((error as RBACError).statusCode).toBe(403);
  });

  it("RBACError message is standard when role not allowed", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "2", email: "m@test.com", name: "M", role: "member" },
      expires: "",
    });
    const error = await requireRole(["admin"]).catch((e: unknown) => e);
    expect((error as RBACError).message).toBe("Azione non consentita per il tuo ruolo");
  });

  it("returns user when member calls requireRole(['admin', 'member'])", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "2", email: "m@test.com", name: "M", role: "member" },
      expires: "",
    });
    await expect(requireRole(["admin", "member"])).resolves.toMatchObject({
      id: "2",
      role: "member",
    });
  });
});

describe("getCurrentUser", () => {
  it("returns null when session is null", async () => {
    mockAuth.mockResolvedValue(null);
    const user = await getCurrentUser();
    expect(user).toBeNull();
  });

  it("returns user from session", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "1", email: "a@b.com", name: "A", role: "admin" },
      expires: "",
    });
    const user = await getCurrentUser();
    expect(user).toMatchObject({ id: "1", email: "a@b.com" });
  });
});
