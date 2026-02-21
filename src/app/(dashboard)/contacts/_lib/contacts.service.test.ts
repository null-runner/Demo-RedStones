/* eslint-disable @typescript-eslint/unbound-method */
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock db
vi.mock("@/server/db", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    transaction: vi.fn(),
    query: {
      contacts: { findFirst: vi.fn() },
      companies: { findFirst: vi.fn() },
      tags: { findFirst: vi.fn() },
    },
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
    const contactsChain = {
      from: vi.fn().mockReturnThis(),
      leftJoin: vi.fn().mockResolvedValue([mockContactWithCompany]),
      where: vi.fn().mockReturnThis(),
    };
    const tagsChain = {
      from: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
    };
    vi.mocked(db.select)
      .mockReturnValueOnce(contactsChain as unknown as ReturnType<typeof db.select>)
      .mockReturnValueOnce(tagsChain as unknown as ReturnType<typeof db.select>);

    const result = await contactsService.getAll();

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      firstName: "Mario",
      lastName: "Rossi",
      companyName: "Acme Corp",
    });
    expect(result[0]?.tags).toEqual([]);
  });

  it("returns empty array when no contacts", async () => {
    const contactsChain = {
      from: vi.fn().mockReturnThis(),
      leftJoin: vi.fn().mockResolvedValue([]),
      where: vi.fn().mockReturnThis(),
    };
    vi.mocked(db.select).mockReturnValueOnce(
      contactsChain as unknown as ReturnType<typeof db.select>,
    );

    const result = await contactsService.getAll();

    expect(result).toEqual([]);
  });

  it("filters by search query using where clause", async () => {
    const contactsChain = {
      from: vi.fn().mockReturnThis(),
      leftJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([mockContactWithCompany]),
    };
    const tagsChain = {
      from: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
    };
    vi.mocked(db.select)
      .mockReturnValueOnce(contactsChain as unknown as ReturnType<typeof db.select>)
      .mockReturnValueOnce(tagsChain as unknown as ReturnType<typeof db.select>);

    const result = await contactsService.getAll("mario");

    expect(contactsChain.where).toHaveBeenCalled();
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
      tagNames: [],
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
      tagNames: [],
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
      contactsService.create({
        firstName: "X",
        lastName: "Y",
        email: "",
        phone: "",
        role: "",
        tagNames: [],
      }),
    ).rejects.toThrow();
  });

  it("throws user-friendly error when company_id does not exist", async () => {
    const chainMock = {
      into: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      returning: vi
        .fn()
        .mockRejectedValue(
          new Error(
            'insert or update on table "contacts" violates foreign key constraint "contacts_company_id_companies_id_fk"',
          ),
        ),
    };
    vi.mocked(db.insert).mockReturnValue(chainMock as unknown as ReturnType<typeof db.insert>);

    await expect(
      contactsService.create({
        firstName: "Test",
        lastName: "User",
        email: "",
        phone: "",
        role: "",
        companyId: "00000000-0000-0000-0000-000000000099",
        tagNames: [],
      }),
    ).rejects.toThrow("Azienda selezionata non trovata");
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
    const txSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    });
    const txDelete = vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue([]),
    });
    vi.mocked(db.transaction).mockImplementation(async (fn) => {
      return fn({ select: txSelect, delete: txDelete } as never);
    });

    await expect(
      contactsService.delete("00000000-0000-0000-0000-000000000001"),
    ).resolves.toBeUndefined();
    expect(txDelete).toHaveBeenCalled();
  });

  it("throws when contact has associated deals", async () => {
    const mockDeal = { id: "deal-1", contactId: "00000000-0000-0000-0000-000000000001" };
    const txSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([mockDeal]),
      }),
    });
    const txDelete = vi.fn();
    vi.mocked(db.transaction).mockImplementation(async (fn) => {
      return fn({ select: txSelect, delete: txDelete } as never);
    });

    await expect(contactsService.delete("00000000-0000-0000-0000-000000000001")).rejects.toThrow(
      "Impossibile eliminare: il contatto ha deal associati",
    );
    expect(txDelete).not.toHaveBeenCalled();
  });
});

const mockContactFull = {
  id: "00000000-0000-0000-0000-000000000001",
  firstName: "Mario",
  lastName: "Rossi",
  email: "mario@example.com",
  phone: null,
  role: "CEO",
  companyId: "00000000-0000-0000-0000-000000000010",
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
  tags: [{ contactId: "c1", tagId: "t1", tag: { id: "t1", name: "react" } }],
};

describe("contactsService.getById", () => {
  it("returns contact with company, tags, deals, and recent activity", async () => {
    vi.mocked(db.query.contacts.findFirst).mockResolvedValue(
      mockContactFull as unknown as Awaited<ReturnType<typeof db.query.contacts.findFirst>>,
    );
    vi.mocked(db.query.companies.findFirst).mockResolvedValue({
      id: "c10",
      name: "Acme",
      domain: "acme.com",
      enrichmentStatus: "none",
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as Awaited<ReturnType<typeof db.query.companies.findFirst>>);

    const selectChainDeals = {
      from: vi.fn().mockReturnThis(),
      where: vi
        .fn()
        .mockResolvedValue([
          { id: "d1", title: "Deal 1", value: "1000", stage: "open", createdAt: new Date() },
        ]),
    };
    const selectChainTimeline = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi
        .fn()
        .mockResolvedValue([
          { id: "te1", type: "note", content: "hello", newStage: null, createdAt: new Date() },
        ]),
    };
    vi.mocked(db.select)
      .mockReturnValueOnce(selectChainDeals as unknown as ReturnType<typeof db.select>)
      .mockReturnValueOnce(selectChainTimeline as unknown as ReturnType<typeof db.select>);

    const result = await contactsService.getById("00000000-0000-0000-0000-000000000001");

    expect(result).not.toBeNull();
    expect(result?.tags).toHaveLength(1);
    expect(result?.tags[0]?.name).toBe("react");
    expect(result?.deals).toHaveLength(1);
    expect(result?.recentActivity).toHaveLength(1);
    expect(result?.companyName).toBe("Acme");
  });

  it("returns null when contact not found", async () => {
    vi.mocked(db.query.contacts.findFirst).mockResolvedValue(undefined);

    const result = await contactsService.getById("00000000-0000-0000-0000-000000000099");

    expect(result).toBeNull();
  });
});

describe("contactsService.getAllTags", () => {
  it("returns all tags sorted by name", async () => {
    const chain = {
      from: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockResolvedValue([
        { id: "t1", name: "react" },
        { id: "t2", name: "sales" },
      ]),
    };
    vi.mocked(db.select).mockReturnValue(chain as unknown as ReturnType<typeof db.select>);

    const result = await contactsService.getAllTags();

    expect(result).toHaveLength(2);
    expect(result[0]?.name).toBe("react");
  });

  it("returns empty array when no tags", async () => {
    const chain = {
      from: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockResolvedValue([]),
    };
    vi.mocked(db.select).mockReturnValue(chain as unknown as ReturnType<typeof db.select>);

    const result = await contactsService.getAllTags();

    expect(result).toEqual([]);
  });
});

describe("contactsService.addTagToContact", () => {
  it("creates new tag and assigns to contact", async () => {
    vi.mocked(db.query.tags.findFirst).mockResolvedValue(undefined);
    const insertChain = {
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([{ id: "t99", name: "newtag" }]),
      onConflictDoNothing: vi.fn().mockReturnThis(),
    };
    vi.mocked(db.insert).mockReturnValue(insertChain as unknown as ReturnType<typeof db.insert>);

    const result = await contactsService.addTagToContact("c1", "NewTag");

    expect(result.name).toBe("newtag");
    expect(db.insert).toHaveBeenCalled();
  });

  it("assigns existing tag to contact (upsert by name)", async () => {
    vi.mocked(db.query.tags.findFirst).mockResolvedValue({ id: "t1", name: "react" } as Awaited<
      ReturnType<typeof db.query.tags.findFirst>
    >);
    const insertChain = {
      values: vi.fn().mockReturnThis(),
      onConflictDoNothing: vi.fn().mockResolvedValue(undefined),
    };
    vi.mocked(db.insert).mockReturnValue(insertChain as unknown as ReturnType<typeof db.insert>);

    const result = await contactsService.addTagToContact("c1", "react");

    expect(result.name).toBe("react");
  });
});

describe("contactsService.removeTagFromContact", () => {
  it("removes tag from contact", async () => {
    const deleteChain = {
      where: vi.fn().mockResolvedValue(undefined),
    };
    vi.mocked(db.delete).mockReturnValue(deleteChain as unknown as ReturnType<typeof db.delete>);

    await contactsService.removeTagFromContact("c1", "t1");

    expect(deleteChain.where).toHaveBeenCalled();
  });
});

describe("contactsService.checkDuplicate", () => {
  it("returns null when no duplicate found", async () => {
    const chain = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
    };
    vi.mocked(db.select).mockReturnValue(chain as unknown as ReturnType<typeof db.select>);

    const result = await contactsService.checkDuplicate("c10", "mario@example.com");

    expect(result).toBeNull();
  });

  it("returns duplicate contact when same company + email domain", async () => {
    const chain = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([{ id: "c1", firstName: "Mario", lastName: "Rossi" }]),
    };
    vi.mocked(db.select).mockReturnValue(chain as unknown as ReturnType<typeof db.select>);

    const result = await contactsService.checkDuplicate("c10", "other@example.com");

    expect(result).not.toBeNull();
    expect(result?.firstName).toBe("Mario");
  });

  it("returns null when same contact is excluded (edit mode)", async () => {
    const chain = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([{ id: "c1", firstName: "Mario", lastName: "Rossi" }]),
    };
    vi.mocked(db.select).mockReturnValue(chain as unknown as ReturnType<typeof db.select>);

    const result = await contactsService.checkDuplicate("c10", "mario@example.com", "c1");

    expect(result).toBeNull();
  });

  it("returns null when email has no domain", async () => {
    const result = await contactsService.checkDuplicate("c10", "noemail");

    expect(result).toBeNull();
    expect(db.select).not.toHaveBeenCalled();
  });
});
