/* eslint-disable @typescript-eslint/unbound-method */
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock server-only before importing service
vi.mock("server-only", () => ({}));

// Mock db
vi.mock("@/server/db", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock drizzle-orm operators
vi.mock("drizzle-orm", async (importOriginal) => {
  const actual = await importOriginal<typeof import("drizzle-orm")>();
  return {
    ...actual,
    ilike: vi.fn((col: unknown, val: unknown) => ({ type: "ilike", col, val })),
    or: vi.fn((...args: unknown[]) => ({ type: "or", args })),
    sql: vi.fn((strings: TemplateStringsArray, ...values: unknown[]) => ({
      type: "sql" as const,
      strings,
      values,
    })),
    eq: vi.fn((col: unknown, val: unknown) => ({ type: "eq", col, val })),
  };
});

import { contactsService } from "./contacts.service";

import { db } from "@/server/db";

const mockContact = {
  id: "00000000-0000-0000-0000-000000000001",
  firstName: "Mario",
  lastName: "Rossi",
  email: "mario@example.com",
  phone: "+39 02 1234567",
  role: "CEO",
  companyId: "00000000-0000-0000-0000-000000000010",
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

const mockContactWithCompany = {
  ...mockContact,
  companyName: "Acme Corp",
};

const mockContact2 = {
  id: "00000000-0000-0000-0000-000000000002",
  firstName: "Luigi",
  lastName: "Bianchi",
  email: "luigi@example.com",
  phone: null,
  role: "CTO",
  companyId: null,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("contactsService.getAll", () => {
  it("returns all contacts with company name", async () => {
    const chainMock = {
      from: vi.fn().mockReturnThis(),
      leftJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
    };
    chainMock.leftJoin.mockResolvedValue([mockContactWithCompany]);
    vi.mocked(db.select).mockReturnValue(chainMock as unknown as ReturnType<typeof db.select>);

    const result = await contactsService.getAll();

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      firstName: "Mario",
      lastName: "Rossi",
      companyName: "Acme Corp",
    });
  });

  it("returns empty array when no contacts", async () => {
    const chainMock = {
      from: vi.fn().mockReturnThis(),
      leftJoin: vi.fn().mockResolvedValue([]),
      where: vi.fn().mockReturnThis(),
    };
    vi.mocked(db.select).mockReturnValue(chainMock as unknown as ReturnType<typeof db.select>);

    const result = await contactsService.getAll();

    expect(result).toEqual([]);
  });

  it("filters by search query using where clause", async () => {
    const chainMock = {
      from: vi.fn().mockReturnThis(),
      leftJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([mockContactWithCompany]),
    };
    vi.mocked(db.select).mockReturnValue(chainMock as unknown as ReturnType<typeof db.select>);

    const result = await contactsService.getAll("mario");

    expect(chainMock.where).toHaveBeenCalled();
    expect(result).toHaveLength(1);
    expect(result[0]?.firstName).toBe("Mario");
  });
});

describe("contactsService.create", () => {
  it("creates a contact with valid data", async () => {
    const input = {
      firstName: "Mario",
      lastName: "Rossi",
      email: "mario@example.com",
      phone: "+39 02 1234567",
      role: "CEO",
      companyId: "00000000-0000-0000-0000-000000000010",
    };

    const chainMock = {
      into: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([mockContact]),
    };
    vi.mocked(db.insert).mockReturnValue(chainMock as unknown as ReturnType<typeof db.insert>);

    const result = await contactsService.create(input);

    expect(chainMock.values).toHaveBeenCalledWith(
      expect.objectContaining({
        firstName: "Mario",
        lastName: "Rossi",
        email: "mario@example.com",
      }),
    );
    expect(result).toMatchObject({ firstName: "Mario", lastName: "Rossi" });
  });

  it("creates contact without optional fields", async () => {
    const input = {
      firstName: "Luigi",
      lastName: "Bianchi",
      email: "",
      phone: "",
      role: "",
    };

    const chainMock = {
      into: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([mockContact2]),
    };
    vi.mocked(db.insert).mockReturnValue(chainMock as unknown as ReturnType<typeof db.insert>);

    const result = await contactsService.create(input);

    expect(result).toMatchObject({ firstName: "Luigi" });
  });

  it("throws when returning is empty (unexpected)", async () => {
    const chainMock = {
      into: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([]),
    };
    vi.mocked(db.insert).mockReturnValue(chainMock as unknown as ReturnType<typeof db.insert>);

    await expect(
      contactsService.create({ firstName: "X", lastName: "Y", email: "", phone: "", role: "" }),
    ).rejects.toThrow();
  });
});

describe("contactsService.update", () => {
  it("updates a contact with valid data", async () => {
    const input = {
      id: "00000000-0000-0000-0000-000000000001",
      firstName: "Mario Updated",
      lastName: "Rossi",
    };

    const chainMock = {
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([{ ...mockContact, firstName: "Mario Updated" }]),
    };
    vi.mocked(db.update).mockReturnValue(chainMock as unknown as ReturnType<typeof db.update>);

    const result = await contactsService.update(input);

    expect(chainMock.set).toHaveBeenCalledWith(
      expect.objectContaining({ firstName: "Mario Updated" }),
    );
    expect(result.firstName).toBe("Mario Updated");
  });

  it("throws when contact not found", async () => {
    const chainMock = {
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([]),
    };
    vi.mocked(db.update).mockReturnValue(chainMock as unknown as ReturnType<typeof db.update>);

    await expect(
      contactsService.update({ id: "00000000-0000-0000-0000-000000000099", firstName: "X" }),
    ).rejects.toThrow("Contatto non trovato");
  });
});

describe("contactsService.delete", () => {
  it("deletes a contact without deals", async () => {
    // First call: select deals → empty array
    // Second call: delete contact
    const selectChain = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
    };
    vi.mocked(db.select).mockReturnValue(selectChain as unknown as ReturnType<typeof db.select>);

    const deleteChain = {
      where: vi.fn().mockResolvedValue([]),
    };
    vi.mocked(db.delete).mockReturnValue(deleteChain as unknown as ReturnType<typeof db.delete>);

    await expect(
      contactsService.delete("00000000-0000-0000-0000-000000000001"),
    ).resolves.toBeUndefined();
    expect(deleteChain.where).toHaveBeenCalled();
  });

  it("throws when contact has associated deals", async () => {
    const mockDeal = { id: "deal-1", contactId: "00000000-0000-0000-0000-000000000001" };
    const selectChain = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([mockDeal]),
    };
    vi.mocked(db.select).mockReturnValue(selectChain as unknown as ReturnType<typeof db.select>);

    await expect(contactsService.delete("00000000-0000-0000-0000-000000000001")).rejects.toThrow(
      "Impossibile eliminare: il contatto ha deal associati",
    );
  });
});
