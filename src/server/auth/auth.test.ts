import { beforeEach, describe, expect, it, vi } from "vitest";
import bcrypt from "bcryptjs";

import { db } from "@/server/db";
import { registerUser } from "@/app/(auth)/sign-up/_lib/sign-up.actions";
import { authorizeCredentials } from "@/server/auth";

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

function mockSelectChain(rows: unknown[]) {
  mockSelect.mockReturnValue({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue(rows),
      }),
    }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockSelectChain([]);
  const mockValues = vi.fn().mockResolvedValue(undefined);
  mockInsert.mockReturnValue({ values: mockValues });
  (db.select as ReturnType<typeof vi.fn>).mockImplementation(mockSelect);
  (db.insert as ReturnType<typeof vi.fn>).mockImplementation(mockInsert);
});

describe("registerUser", () => {
  it("returns error when email already exists", async () => {
    mockSelectChain([{ id: "existing-id" }]);
    const result = await registerUser({
      name: "Test User",
      email: "existing@example.com",
      password: "password123",
    });
    expect(result).toEqual({ error: "Email già registrata" });
  });

  it("does not call db.insert when email already exists", async () => {
    mockSelectChain([{ id: "existing-id" }]);
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
      /* signIn redirect throws REDIRECT_ERROR */
    }
    expect(bcrypt.hash).toHaveBeenCalledWith("plaintext123", 12);
    expect(mockValues).toHaveBeenCalledTimes(1);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- asserted toHaveBeenCalledTimes(1) above
    const insertedValues = mockValues.mock.calls[0]![0] as Record<string, unknown>;
    expect(insertedValues["passwordHash"]).toBe("hashed_password");
    expect(insertedValues["passwordHash"]).not.toBe("plaintext123");
  });

  it("inserts user with role 'member' by default", async () => {
    const mockValues = vi.fn().mockResolvedValue(undefined);
    mockInsert.mockReturnValue({ values: mockValues });
    try {
      await registerUser({ name: "New User", email: "new@example.com", password: "password123" });
    } catch {
      /* signIn redirect throws REDIRECT_ERROR */
    }
    expect(mockValues).toHaveBeenCalledTimes(1);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- asserted toHaveBeenCalledTimes(1) above
    const insertedValues = mockValues.mock.calls[0]![0] as Record<string, unknown>;
    expect(insertedValues["role"]).toBe("member");
  });

  it("returns error for invalid input (missing name)", async () => {
    const result = await registerUser({
      name: "",
      email: "test@example.com",
      password: "password123",
    });
    expect(result).toEqual({ error: expect.stringContaining("Nome") as string });
    expect(mockSelect).not.toHaveBeenCalled();
  });

  it("returns error for invalid input (short password)", async () => {
    const result = await registerUser({
      name: "Test",
      email: "test@example.com",
      password: "short",
    });
    expect(result).toEqual({ error: expect.stringContaining("8") as string });
    expect(mockSelect).not.toHaveBeenCalled();
  });

  it("returns error for invalid input (bad email)", async () => {
    const result = await registerUser({
      name: "Test",
      email: "not-an-email",
      password: "password123",
    });
    expect(result).toEqual({ error: expect.stringContaining("Email") as string });
    expect(mockSelect).not.toHaveBeenCalled();
  });
});

describe("authorizeCredentials", () => {
  it("returns null when user does not exist (no user enumeration)", async () => {
    mockSelectChain([]);
    const result = await authorizeCredentials({
      email: "nobody@example.com",
      password: "password123",
    });
    expect(result).toBeNull();
  });

  it("returns null when user has no passwordHash (guest user)", async () => {
    mockSelectChain([
      {
        id: "guest-id",
        email: "guest@example.com",
        name: "Guest",
        passwordHash: null,
        role: "guest",
      },
    ]);
    const result = await authorizeCredentials({
      email: "guest@example.com",
      password: "password123",
    });
    expect(result).toBeNull();
  });

  it("returns null when password is wrong (no user enumeration)", async () => {
    mockSelectChain([
      {
        id: "user-id",
        email: "user@example.com",
        name: "Test User",
        passwordHash: "hashed_password",
        role: "member",
      },
    ]);
    (bcrypt.compare as ReturnType<typeof vi.fn>).mockResolvedValue(false);
    const result = await authorizeCredentials({
      email: "user@example.com",
      password: "wrong_password",
    });
    expect(result).toBeNull();
    expect(bcrypt.compare).toHaveBeenCalledWith("wrong_password", "hashed_password");
  });

  it("returns user object when credentials are correct", async () => {
    mockSelectChain([
      {
        id: "user-id",
        email: "user@example.com",
        name: "Test User",
        passwordHash: "hashed_password",
        role: "member",
      },
    ]);
    (bcrypt.compare as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    const result = await authorizeCredentials({
      email: "user@example.com",
      password: "correct_password",
    });
    expect(result).toEqual({
      id: "user-id",
      email: "user@example.com",
      name: "Test User",
      role: "member",
    });
    expect(bcrypt.compare).toHaveBeenCalledWith("correct_password", "hashed_password");
  });

  it("does not include passwordHash in returned user object", async () => {
    mockSelectChain([
      {
        id: "user-id",
        email: "user@example.com",
        name: "Test User",
        passwordHash: "hashed_password",
        role: "member",
      },
    ]);
    (bcrypt.compare as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    const result = await authorizeCredentials({
      email: "user@example.com",
      password: "correct_password",
    });
    expect(result).not.toHaveProperty("passwordHash");
  });
});
