/* eslint-disable @typescript-eslint/unbound-method */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/db", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    transaction: vi.fn(),
    query: {
      companies: {
        findFirst: vi.fn(),
      },
    },
  },
}));

vi.mock("drizzle-orm", async (importOriginal) => {
  const actual = await importOriginal<typeof import("drizzle-orm")>();
  return {
    ...actual,
    eq: vi.fn((col: unknown, val: unknown) => ({ type: "eq", col, val })),
    asc: vi.fn((col: unknown) => ({ type: "asc", col })),
    desc: vi.fn((col: unknown) => ({ type: "desc", col })),
  };
});

import type { CompanyWithDetails } from "./companies.service";
import { companiesService } from "./companies.service";

import { db } from "@/server/db";

const mockCompany = {
  id: "00000000-0000-0000-0000-000000000001",
  name: "RedStones Srl",
  domain: "redstones.it",
  sector: "SaaS",
  description: "Agenzia SaaS",
  legalAddress: null,
  operationalAddress: null,
  enrichmentDescription: null,
  enrichmentSector: null,
  enrichmentSize: null,
  enrichmentPainPoints: null,
  enrichmentStatus: "not_enriched" as const,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

const mockCompany2 = {
  id: "00000000-0000-0000-0000-000000000002",
  name: "Acme Corp",
  domain: null,
  sector: null,
  description: null,
  legalAddress: null,
  operationalAddress: null,
  enrichmentDescription: null,
  enrichmentSector: null,
  enrichmentSize: null,
  enrichmentPainPoints: null,
  enrichmentStatus: "not_enriched" as const,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("companiesService.getAll", () => {
  it("returns companies ordered by name", async () => {
    const chain = {
      from: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockResolvedValue([mockCompany, mockCompany2]),
    };
    vi.mocked(db.select).mockReturnValue(chain as unknown as ReturnType<typeof db.select>);

    const result = await companiesService.getAll();

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ name: "RedStones Srl" });
    expect(chain.from).toHaveBeenCalled();
    expect(chain.orderBy).toHaveBeenCalled();
  });

  it("returns empty array when no companies", async () => {
    const chain = {
      from: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockResolvedValue([]),
    };
    vi.mocked(db.select).mockReturnValue(chain as unknown as ReturnType<typeof db.select>);

    const result = await companiesService.getAll();

    expect(result).toEqual([]);
  });
});

describe("companiesService.create", () => {
  it("creates company with name and domain", async () => {
    const chain = {
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([mockCompany]),
    };
    vi.mocked(db.insert).mockReturnValue(chain as unknown as ReturnType<typeof db.insert>);

    const result = await companiesService.create({ name: "RedStones Srl", domain: "redstones.it" });

    expect(chain.values).toHaveBeenCalledWith(
      expect.objectContaining({ name: "RedStones Srl", domain: "redstones.it" }),
    );
    expect(result).toMatchObject({ name: "RedStones Srl" });
  });

  it("creates company with null domain when domain is empty string", async () => {
    const chain = {
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([{ ...mockCompany2 }]),
    };
    vi.mocked(db.insert).mockReturnValue(chain as unknown as ReturnType<typeof db.insert>);

    await companiesService.create({ name: "Acme Corp", domain: "" });

    expect(chain.values).toHaveBeenCalledWith(expect.objectContaining({ domain: null }));
  });

  it("creates company with only name (optional fields null)", async () => {
    const chain = {
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([mockCompany2]),
    };
    vi.mocked(db.insert).mockReturnValue(chain as unknown as ReturnType<typeof db.insert>);

    const result = await companiesService.create({ name: "Acme Corp" });

    expect(result).toMatchObject({ name: "Acme Corp" });
  });
});

describe("companiesService.update", () => {
  it("updates company fields", async () => {
    const chain = {
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([{ ...mockCompany, name: "Updated Name" }]),
    };
    vi.mocked(db.update).mockReturnValue(chain as unknown as ReturnType<typeof db.update>);

    const result = await companiesService.update("00000000-0000-0000-0000-000000000001", {
      name: "Updated Name",
    });

    expect(chain.set).toHaveBeenCalledWith(expect.objectContaining({ name: "Updated Name" }));
    expect(result).toMatchObject({ name: "Updated Name" });
  });

  it("returns null when company not found", async () => {
    const chain = {
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([]),
    };
    vi.mocked(db.update).mockReturnValue(chain as unknown as ReturnType<typeof db.update>);

    const result = await companiesService.update("00000000-0000-0000-0000-000000000099", {
      name: "X",
    });

    expect(result).toBeNull();
  });
});

describe("companiesService.delete", () => {
  it("deletes company when no contacts or deals", async () => {
    const txSelect = vi.fn().mockImplementation(() => ({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    }));
    const txDelete = vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    });
    vi.mocked(db.transaction).mockImplementation(async (fn) => {
      return fn({ select: txSelect, delete: txDelete } as never);
    });

    await expect(
      companiesService.delete("00000000-0000-0000-0000-000000000001"),
    ).resolves.toBeUndefined();
    expect(txDelete).toHaveBeenCalled();
  });

  it("throws when company has contacts", async () => {
    let callCount = 0;
    const txSelect = vi.fn().mockImplementation(() => {
      callCount++;
      return {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue(callCount === 1 ? [{ id: "c1" }] : []),
          }),
        }),
      };
    });
    const txDelete = vi.fn();
    vi.mocked(db.transaction).mockImplementation(async (fn) => {
      return fn({ select: txSelect, delete: txDelete } as never);
    });

    await expect(companiesService.delete("00000000-0000-0000-0000-000000000001")).rejects.toThrow(
      "Impossibile eliminare",
    );
    expect(txDelete).not.toHaveBeenCalled();
  });

  it("throws when company has deals", async () => {
    let callCount = 0;
    const txSelect = vi.fn().mockImplementation(() => {
      callCount++;
      return {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue(callCount === 2 ? [{ id: "d1" }] : []),
          }),
        }),
      };
    });
    const txDelete = vi.fn();
    vi.mocked(db.transaction).mockImplementation(async (fn) => {
      return fn({ select: txSelect, delete: txDelete } as never);
    });

    await expect(companiesService.delete("00000000-0000-0000-0000-000000000001")).rejects.toThrow(
      "Impossibile eliminare",
    );
    expect(txDelete).not.toHaveBeenCalled();
  });
});

describe("companiesService.getById", () => {
  const mockContact = {
    id: "c1",
    firstName: "Mario",
    lastName: "Rossi",
    email: "mario@test.com",
    role: "CEO",
  };
  const mockDeal = { id: "d1", title: "Deal Alpha", value: "5000.00", stage: "proposal" };
  const mockCompanyWithDetails: CompanyWithDetails = {
    ...mockCompany,
    contacts: [mockContact],
    deals: [mockDeal],
  };

  it("returns company with contacts and deals", async () => {
    vi.mocked(
      db.query.companies.findFirst as unknown as ReturnType<typeof vi.fn>,
    ).mockResolvedValue(mockCompanyWithDetails);

    const result = await companiesService.getById("00000000-0000-0000-0000-000000000001");

    expect(result).not.toBeNull();
    expect(result?.contacts).toHaveLength(1);
    expect(result?.contacts[0]).toMatchObject({ firstName: "Mario", lastName: "Rossi" });
    expect(result?.deals).toHaveLength(1);
    expect(result?.deals[0]).toMatchObject({ title: "Deal Alpha", stage: "proposal" });
  });

  it("returns company with empty contacts and deals", async () => {
    vi.mocked(
      db.query.companies.findFirst as unknown as ReturnType<typeof vi.fn>,
    ).mockResolvedValue({ ...mockCompanyWithDetails, contacts: [], deals: [] });

    const result = await companiesService.getById("00000000-0000-0000-0000-000000000001");

    expect(result).not.toBeNull();
    expect(result?.contacts).toEqual([]);
    expect(result?.deals).toEqual([]);
  });

  it("returns null when company not found", async () => {
    vi.mocked(
      db.query.companies.findFirst as unknown as ReturnType<typeof vi.fn>,
    ).mockResolvedValue(undefined);

    const result = await companiesService.getById("00000000-0000-0000-0000-000000000099");

    expect(result).toBeNull();
  });
});

describe("companiesService.updateEnrichment", () => {
  it("updates enrichment fields and returns company", async () => {
    const updated = {
      ...mockCompany,
      enrichmentDescription: "Agenzia digitale",
      enrichmentSector: "SaaS",
      enrichmentSize: "11-50",
      enrichmentPainPoints: "Scaling\nProcessi manuali",
      enrichmentStatus: "enriched" as const,
    };
    const chain = {
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([updated]),
    };
    vi.mocked(db.update).mockReturnValue(chain as unknown as ReturnType<typeof db.update>);

    const result = await companiesService.updateEnrichment(mockCompany.id, {
      enrichmentDescription: "Agenzia digitale",
      enrichmentSector: "SaaS",
      enrichmentSize: "11-50",
      enrichmentPainPoints: "Scaling\nProcessi manuali",
    });

    expect(result).toMatchObject({ enrichmentDescription: "Agenzia digitale" });
    expect(chain.set).toHaveBeenCalledWith(
      expect.objectContaining({
        enrichmentDescription: "Agenzia digitale",
        enrichmentStatus: "enriched",
      }),
    );
  });

  it("sets status to partial when some fields are null", async () => {
    const updated = {
      ...mockCompany,
      enrichmentDescription: "Agenzia digitale",
      enrichmentSector: null,
      enrichmentSize: null,
      enrichmentPainPoints: null,
      enrichmentStatus: "partial" as const,
    };
    const chain = {
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([updated]),
    };
    vi.mocked(db.update).mockReturnValue(chain as unknown as ReturnType<typeof db.update>);

    await companiesService.updateEnrichment(mockCompany.id, {
      enrichmentDescription: "Agenzia digitale",
      enrichmentSector: null,
      enrichmentSize: null,
      enrichmentPainPoints: null,
    });

    expect(chain.set).toHaveBeenCalledWith(
      expect.objectContaining({ enrichmentStatus: "partial" }),
    );
  });

  it("sets status to not_enriched when all fields are null", async () => {
    const chain = {
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([{ ...mockCompany, enrichmentStatus: "not_enriched" }]),
    };
    vi.mocked(db.update).mockReturnValue(chain as unknown as ReturnType<typeof db.update>);

    await companiesService.updateEnrichment(mockCompany.id, {
      enrichmentDescription: null,
      enrichmentSector: null,
      enrichmentSize: null,
      enrichmentPainPoints: null,
    });

    expect(chain.set).toHaveBeenCalledWith(
      expect.objectContaining({ enrichmentStatus: "not_enriched" }),
    );
  });

  it("returns null when company not found", async () => {
    const chain = {
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([]),
    };
    vi.mocked(db.update).mockReturnValue(chain as unknown as ReturnType<typeof db.update>);

    const result = await companiesService.updateEnrichment("nonexistent-id", {
      enrichmentDescription: "test",
      enrichmentSector: null,
      enrichmentSize: null,
      enrichmentPainPoints: null,
    });

    expect(result).toBeNull();
  });
});
