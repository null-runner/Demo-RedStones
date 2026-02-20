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
      pipelineStages: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
      },
      deals: {
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
    sql: vi.fn(),
  };
});

import { pipelineStagesService } from "./pipeline-stages.service";

import { db } from "@/server/db";

const mockStage = {
  id: "ps1",
  name: "Lead",
  sortOrder: 1,
  isProtected: false,
  createdAt: new Date("2026-01-01"),
};

const mockProtectedStage = {
  id: "ps6",
  name: "Chiuso Vinto",
  sortOrder: 6,
  isProtected: true,
  createdAt: new Date("2026-01-01"),
};

const mockProtectedStage2 = {
  id: "ps7",
  name: "Chiuso Perso",
  sortOrder: 7,
  isProtected: true,
  createdAt: new Date("2026-01-01"),
};

function mockTransactionWith(mockTx: Record<string, unknown>) {
  vi.mocked(db.transaction).mockImplementation(
    (fn: (tx: never) => Promise<unknown>) => fn(mockTx as never) as never,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("pipelineStagesService.getAll", () => {
  it("returns all stages ordered by sortOrder", async () => {
    vi.mocked(db.query.pipelineStages.findMany).mockResolvedValue([mockStage, mockProtectedStage]);

    const result = await pipelineStagesService.getAll();
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ name: "Lead" });
  });
});

describe("pipelineStagesService.create", () => {
  it("inserts new stage and bumps protected stages", async () => {
    vi.mocked(db.query.pipelineStages.findMany).mockResolvedValue([
      mockStage,
      mockProtectedStage,
      mockProtectedStage2,
    ]);
    const mockTx = {
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      returning: vi
        .fn()
        .mockResolvedValue([{ ...mockStage, id: "ps-new", name: "Nuovo Stage", sortOrder: 2 }]),
    };
    mockTransactionWith(mockTx);

    const result = await pipelineStagesService.create("Nuovo Stage");
    expect(result).toMatchObject({ name: "Nuovo Stage" });
    expect(db.transaction).toHaveBeenCalledOnce();
  });

  it("throws if name is a protected stage name", async () => {
    await expect(pipelineStagesService.create("Chiuso Vinto")).rejects.toThrow(/riservato/i);
  });

  it("throws if name already exists", async () => {
    vi.mocked(db.query.pipelineStages.findMany).mockResolvedValue([mockStage, mockProtectedStage]);

    await expect(pipelineStagesService.create("Lead")).rejects.toThrow(/esiste già/i);
  });
});

describe("pipelineStagesService.rename", () => {
  it("updates stage name and propagates to deals", async () => {
    vi.mocked(db.query.pipelineStages.findFirst).mockResolvedValue(mockStage);
    vi.mocked(db.query.pipelineStages.findMany).mockResolvedValue([mockStage, mockProtectedStage]);
    const mockTx = {
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([{ ...mockStage, name: "Prospect" }]),
    };
    mockTransactionWith(mockTx);

    await expect(pipelineStagesService.rename("ps1", "Prospect")).resolves.not.toThrow();
  });

  it("throws if stage is protected", async () => {
    vi.mocked(db.query.pipelineStages.findFirst).mockResolvedValue(mockProtectedStage);

    await expect(pipelineStagesService.rename("ps6", "Nuovo Nome")).rejects.toThrow(/protetto/i);
  });

  it("throws if stage not found", async () => {
    vi.mocked(db.query.pipelineStages.findFirst).mockResolvedValue(undefined);

    await expect(pipelineStagesService.rename("nonexistent", "X")).rejects.toThrow();
  });

  it("throws if new name is a protected name", async () => {
    await expect(pipelineStagesService.rename("ps1", "Chiuso Vinto")).rejects.toThrow(/riservato/i);
  });

  it("throws if new name already exists on another stage", async () => {
    const otherStage = { ...mockStage, id: "ps2", name: "Demo", sortOrder: 3 };
    vi.mocked(db.query.pipelineStages.findFirst).mockResolvedValue(mockStage);
    vi.mocked(db.query.pipelineStages.findMany).mockResolvedValue([
      mockStage,
      otherStage,
      mockProtectedStage,
    ]);

    await expect(pipelineStagesService.rename("ps1", "Demo")).rejects.toThrow(/esiste già/i);
  });
});

describe("pipelineStagesService.reorder", () => {
  it("updates sortOrder for each stage in a transaction", async () => {
    const mockTx = {
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
    };
    mockTransactionWith(mockTx);

    await pipelineStagesService.reorder(["ps1", "ps2", "ps3"]);
    expect(db.transaction).toHaveBeenCalledOnce();
    // update called 3 times (once per stage)
    expect(mockTx.update).toHaveBeenCalledTimes(3);
  });

  it("skips empty ids in the array", async () => {
    const mockTx = {
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
    };
    mockTransactionWith(mockTx);

    await pipelineStagesService.reorder(["ps1", "", "ps3"]);
    expect(mockTx.update).toHaveBeenCalledTimes(2);
  });
});

describe("pipelineStagesService.delete", () => {
  it("deletes stage when no deals associated", async () => {
    vi.mocked(db.query.pipelineStages.findFirst).mockResolvedValue(mockStage);
    vi.mocked(db.query.deals.findFirst).mockResolvedValue(undefined);
    const chain = { where: vi.fn().mockResolvedValue([]) };
    vi.mocked(db.delete).mockReturnValue(chain as unknown as ReturnType<typeof db.delete>);

    await expect(pipelineStagesService.delete("ps1")).resolves.not.toThrow();
    expect(db.delete).toHaveBeenCalled();
  });

  it("throws if stage has associated deals", async () => {
    vi.mocked(db.query.pipelineStages.findFirst).mockResolvedValue(mockStage);
    vi.mocked(db.query.deals.findFirst).mockResolvedValue({ id: "d1" } as never);

    await expect(pipelineStagesService.delete("ps1")).rejects.toThrow(/deal associati/i);
    expect(db.delete).not.toHaveBeenCalled();
  });

  it("throws if stage is protected", async () => {
    vi.mocked(db.query.pipelineStages.findFirst).mockResolvedValue(mockProtectedStage);

    await expect(pipelineStagesService.delete("ps6")).rejects.toThrow(/protetto/i);
    expect(db.delete).not.toHaveBeenCalled();
  });

  it("throws if stage not found", async () => {
    vi.mocked(db.query.pipelineStages.findFirst).mockResolvedValue(undefined);

    await expect(pipelineStagesService.delete("nonexistent")).rejects.toThrow();
  });
});
