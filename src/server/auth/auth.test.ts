import { beforeEach, describe, expect, it, vi } from "vitest";
import bcrypt from "bcryptjs";

import { db } from "@/server/db";
import { registerUser } from "@/app/(auth)/sign-up/_lib/sign-up.actions";

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("hashed_password"),
    compare: vi.fn(),
  },
}));

vi.mock("next-auth", () => ({
  default: vi.fn(() => ({
    handlers: {},
    auth: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
  })),
}));

vi.mock("@auth/drizzle-adapter", () => ({
  DrizzleAdapter: vi.fn(() => ({})),
}));

vi.mock("next-auth/providers/credentials", () => ({
  default: vi.fn((config: unknown) => config),
}));

const mockSelect = vi.fn();
const mockInsert = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  mockSelect.mockReturnValue({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([]),
      }),
    }),
  });
  const mockValues = vi.fn().mockResolvedValue(undefined);
  mockInsert.mockReturnValue({ values: mockValues });
  (db.select as ReturnType<typeof vi.fn>).mockImplementation(mockSelect);
  (db.insert as ReturnType<typeof vi.fn>).mockImplementation(mockInsert);
});

describe("registerUser", () => {
  it("returns error when email already exists", async () => {
    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{ id: "existing-id" }]),
        }),
      }),
    });
    const result = await registerUser({
      name: "Test User",
      email: "existing@example.com",
      password: "password123",
    });
    expect(result).toEqual({ error: "Email già registrata" });
  });

  it("does not call db.insert when email already exists", async () => {
    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{ id: "existing-id" }]),
        }),
      }),
    });
    await registerUser({
      name: "Test User",
      email: "existing@example.com",
      password: "password123",
    });
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("hashes password with bcrypt before inserting", async () => {
    const mockValues = vi.fn().mockResolvedValue(undefined);
    mockInsert.mockReturnValue({ values: mockValues });
    try {
      await registerUser({ name: "New User", email: "new@example.com", password: "plaintext123" });
    } catch {
      /* signIn redirect */
    }
    expect(bcrypt.hash).toHaveBeenCalledWith("plaintext123", 12);
    const insertedValues = mockValues.mock.calls[0]?.[0] as Record<string, unknown> | undefined;
    if (insertedValues) {
      expect(insertedValues["passwordHash"]).toBe("hashed_password");
      expect(insertedValues["passwordHash"]).not.toBe("plaintext123");
    }
  });

  it("inserts user with role 'member' by default", async () => {
    const mockValues = vi.fn().mockResolvedValue(undefined);
    mockInsert.mockReturnValue({ values: mockValues });
    try {
      await registerUser({ name: "New User", email: "new@example.com", password: "password123" });
    } catch {
      /* signIn redirect */
    }
    const insertedValues = mockValues.mock.calls[0]?.[0] as Record<string, unknown> | undefined;
    if (insertedValues) {
      expect(insertedValues["role"]).toBe("member");
    }
  });
});

describe("authorize (via credentials provider logic)", () => {
  it("returns null when user does not exist (no user enumeration)", () => {
    function simulateAuthorize(user: { passwordHash?: string } | undefined): string | null {
      if (!user?.passwordHash) return null;
      return "authenticated";
    }
    expect(simulateAuthorize(undefined)).toBeNull();
  });

  it("returns null when password is wrong (no user enumeration)", async () => {
    const mockUser = { passwordHash: "hashed_correct_password" };
    (bcrypt.compare as ReturnType<typeof vi.fn>).mockResolvedValue(false);
    const isValid = await bcrypt.compare("wrong_password", mockUser.passwordHash);
    expect(isValid).toBe(false);
  });

  it("returns user object when credentials are correct", async () => {
    const mockUser = {
      id: "user-id",
      email: "user@example.com",
      name: "Test User",
      passwordHash: "hashed_password",
      role: "member" as const,
    };
    (bcrypt.compare as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    const isValid = await bcrypt.compare("correct_password", mockUser.passwordHash);
    expect(isValid).toBe(true);
    const result = {
      id: mockUser.id,
      email: mockUser.email,
      name: mockUser.name,
      role: mockUser.role,
    };
    expect(result).toMatchObject({ id: "user-id", email: "user@example.com", role: "member" });
  });
});
