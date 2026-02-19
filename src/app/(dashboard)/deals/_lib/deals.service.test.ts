/* eslint-disable @typescript-eslint/unbound-method */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/server/db", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("drizzle-orm", async (importOriginal) => {
  const actual = await importOriginal<typeof import("drizzle-orm")>();
  return {
    ...actual,
    eq: vi.fn((col: unknown, val: unknown) => ({ type: "eq", col, val })),
    desc: vi.fn((col: unknown) => ({ type: "desc", col })),
  };
});

import { dealsService } from "./deals.service";

import { db } from "@/server/db";

const mockDeal = {
  id: "d1",
  title: "Test Deal",
  value: "5000.00",
  stage: "Lead" as const,
  contactId: null,
  companyId: null,
  ownerId: null,
  lostReason: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("dealsService.getAll", () => {
  it("returns all deals ordered by createdAt desc", async () => {
    const chain = {
      from: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockResolvedValue([mockDeal, { ...mockDeal, id: "d2" }]),
    };
    vi.mocked(db.select).mockReturnValue(chain as unknown as ReturnType<typeof db.select>);

    const result = await dealsService.getAll();
    expect(result).toHaveLength(2);
  });

  it("returns empty array when no deals", async () => {
    const chain = {
      from: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockResolvedValue([]),
    };
    vi.mocked(db.select).mockReturnValue(chain as unknown as ReturnType<typeof db.select>);

    const result = await dealsService.getAll();
    expect(result).toHaveLength(0);
  });
});

describe("dealsService.create", () => {
  it("creates deal and returns it", async () => {
    const chain = {
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([mockDeal]),
    };
    vi.mocked(db.insert).mockReturnValue(chain as unknown as ReturnType<typeof db.insert>);

    const result = await dealsService.create({
      title: "Test Deal",
      value: 5000,
      stage: "Lead",
      contactId: null,
      companyId: null,
      ownerId: null,
    });
    expect(result).toEqual(mockDeal);
  });

  it("throws when insert returns empty", async () => {
    const chain = {
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([]),
    };
    vi.mocked(db.insert).mockReturnValue(chain as unknown as ReturnType<typeof db.insert>);

    await expect(
      dealsService.create({ title: "Test Deal", value: 5000, stage: "Lead" }),
    ).rejects.toThrow("Errore durante la creazione del deal");
  });

  it("converts value number to string for DB", async () => {
    const chain = {
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([mockDeal]),
    };
    vi.mocked(db.insert).mockReturnValue(chain as unknown as ReturnType<typeof db.insert>);

    await dealsService.create({ title: "Test Deal", value: 5000, stage: "Lead" });
    expect(chain.values).toHaveBeenCalledWith(expect.objectContaining({ value: "5000" }));
  });
});

describe("dealsService.update", () => {
  it("updates deal and returns it", async () => {
    const updatedDeal = { ...mockDeal, title: "Updated" };
    const chain = {
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([updatedDeal]),
    };
    vi.mocked(db.update).mockReturnValue(chain as unknown as ReturnType<typeof db.update>);

    const result = await dealsService.update("d1", { title: "Updated" });
    expect(result).toEqual(updatedDeal);
  });

  it("returns null when deal not found", async () => {
    const chain = {
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([]),
    };
    vi.mocked(db.update).mockReturnValue(chain as unknown as ReturnType<typeof db.update>);

    const result = await dealsService.update("d1", { title: "Updated" });
    expect(result).toBeNull();
  });

  it("converts value number to string for DB", async () => {
    const chain = {
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([{ ...mockDeal, value: "8000" }]),
    };
    vi.mocked(db.update).mockReturnValue(chain as unknown as ReturnType<typeof db.update>);

    await dealsService.update("d1", { value: 8000 });
    expect(chain.set).toHaveBeenCalledWith(expect.objectContaining({ value: "8000" }));
  });
});

describe("dealsService.delete", () => {
  it("deletes deal", async () => {
    const chain = {
      where: vi.fn().mockResolvedValue(undefined),
    };
    vi.mocked(db.delete).mockReturnValue(chain as unknown as ReturnType<typeof db.delete>);

    await expect(dealsService.delete("d1")).resolves.not.toThrow();
    expect(chain.where).toHaveBeenCalled();
  });
});
