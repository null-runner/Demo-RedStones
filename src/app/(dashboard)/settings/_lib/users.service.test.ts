/* eslint-disable @typescript-eslint/unbound-method */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("hashed_password"),
  },
}));

import { usersService } from "./users.service";

import { db } from "@/server/db";

const mockUsers = [
  {
    id: "user-1",
    name: "Mario Rossi",
    email: "mario@test.com",
    role: "member" as const,
    createdAt: new Date("2024-01-01"),
    invitedAt: null,
  },
  {
    id: "admin-1",
    name: "Admin User",
    email: "admin@test.com",
    role: "admin" as const,
    createdAt: new Date("2024-01-02"),
    invitedAt: new Date("2024-01-02"),
  },
];

describe("usersService.getAllUsers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns array of users ordered by createdAt desc", async () => {
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        orderBy: vi.fn().mockResolvedValue(mockUsers),
      }),
    } as never);

    const result = await usersService.getAllUsers();
    expect(result).toEqual(mockUsers);
    expect(db.select).toHaveBeenCalled();
  });
});

describe("usersService.inviteUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws when email already exists", async () => {
    vi.mocked(db.select).mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{ id: "existing-1" }]),
        }),
      }),
    } as never);

    await expect(usersService.inviteUser("mario@test.com", "member")).rejects.toThrow(
      "Email già registrata nel sistema",
    );
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("creates user and returns user with invitedAt", async () => {
    vi.mocked(db.select).mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    } as never);

    const newUser = {
      id: "new-1",
      name: "newuser",
      email: "newuser@test.com",
      role: "member" as const,
      createdAt: new Date(),
      invitedAt: new Date(),
    };

    vi.mocked(db.insert).mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([newUser]),
      }),
    } as never);

    const result = await usersService.inviteUser("newuser@test.com", "member");

    expect(result).toEqual(newUser);
    expect(result.invitedAt).not.toBeNull();
    expect(db.insert).toHaveBeenCalled();
  });
});

describe("usersService.deleteUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws SELF_DELETE when targetId equals currentUserId", async () => {
    await expect(usersService.deleteUser("user-1", "user-1")).rejects.toThrow("SELF_DELETE");
    expect(db.transaction).not.toHaveBeenCalled();
  });

  it("throws LAST_ADMIN when target is the only admin", async () => {
    const txSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ id: "admin-1" }]),
      }),
    });
    const txDelete = vi.fn();
    const txUpdate = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    });
    vi.mocked(db.transaction).mockImplementation(async (fn) => {
      return fn({ select: txSelect, delete: txDelete, update: txUpdate } as never);
    });

    await expect(usersService.deleteUser("admin-1", "current-user")).rejects.toThrow("LAST_ADMIN");
    expect(txDelete).not.toHaveBeenCalled();
  });

  it("deletes user successfully and orphans owned deals", async () => {
    const txSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ id: "admin-1" }, { id: "admin-2" }]),
      }),
    });
    const txDelete = vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    });
    const txUpdate = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    });
    vi.mocked(db.transaction).mockImplementation(async (fn) => {
      return fn({ select: txSelect, delete: txDelete, update: txUpdate } as never);
    });

    await expect(usersService.deleteUser("member-1", "current-user")).resolves.toBeUndefined();
    expect(txUpdate).toHaveBeenCalled();
    expect(txDelete).toHaveBeenCalled();
  });
});
