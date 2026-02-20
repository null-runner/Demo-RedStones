/* eslint-disable @typescript-eslint/unbound-method */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/db", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    query: {
      timelineEntries: {
        findMany: vi.fn(),
      },
    },
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

import { timelineService } from "./timeline.service";

import { db } from "@/server/db";

const mockEntry = {
  id: "te1",
  dealId: "d1",
  type: "note" as const,
  content: "Prima nota sul deal",
  previousStage: null,
  newStage: null,
  authorId: null,
  createdAt: new Date("2026-01-15T10:00:00Z"),
};

const mockStageChangeEntry = {
  id: "te2",
  dealId: "d1",
  type: "stage_change" as const,
  content: null,
  previousStage: "Lead",
  newStage: "Qualificato",
  authorId: null,
  createdAt: new Date("2026-01-16T10:00:00Z"),
};

const mockEntryWithAuthor = {
  ...mockEntry,
  author: null,
};

beforeEach(() => {
  vi.clearAllMocks();
});

const mockStageChangeWithAuthor = {
  ...mockStageChangeEntry,
  author: { id: "u1", name: "Jacopo Rampinelli" },
};

describe("timelineService.getByDealId", () => {
  it("returns entries with author in descending order", async () => {
    vi.mocked(db.query.timelineEntries.findMany).mockResolvedValue([mockEntryWithAuthor]);

    const result = await timelineService.getByDealId("d1");
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: "te1", type: "note" });
  });

  it("returns empty array when no entries", async () => {
    vi.mocked(db.query.timelineEntries.findMany).mockResolvedValue([]);

    const result = await timelineService.getByDealId("d1");
    expect(result).toHaveLength(0);
  });

  it("returns mixed note and stage_change entries", async () => {
    vi.mocked(db.query.timelineEntries.findMany).mockResolvedValue([
      mockStageChangeWithAuthor,
      mockEntryWithAuthor,
    ]);

    const result = await timelineService.getByDealId("d1");
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ type: "stage_change" });
    expect(result[1]).toMatchObject({ type: "note" });
  });
});

describe("timelineService.addNote", () => {
  it("inserts note entry and returns it", async () => {
    const chain = {
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([mockEntry]),
    };
    vi.mocked(db.insert).mockReturnValue(chain as unknown as ReturnType<typeof db.insert>);

    const result = await timelineService.addNote("d1", "Prima nota sul deal", null);
    expect(result).toMatchObject({ type: "note", content: "Prima nota sul deal" });
    expect(chain.values).toHaveBeenCalledWith(
      expect.objectContaining({ dealId: "d1", type: "note", content: "Prima nota sul deal" }),
    );
  });

  it("throws if insert returns empty", async () => {
    const chain = {
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([]),
    };
    vi.mocked(db.insert).mockReturnValue(chain as unknown as ReturnType<typeof db.insert>);

    await expect(timelineService.addNote("d1", "nota", null)).rejects.toThrow();
  });
});

describe("timelineService.recordStageChange", () => {
  it("inserts stage_change entry and returns it", async () => {
    const chain = {
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([mockStageChangeEntry]),
    };
    vi.mocked(db.insert).mockReturnValue(chain as unknown as ReturnType<typeof db.insert>);

    const result = await timelineService.recordStageChange("d1", "Lead", "Qualificato", null);
    expect(result).toMatchObject({
      type: "stage_change",
      previousStage: "Lead",
      newStage: "Qualificato",
    });
    expect(chain.values).toHaveBeenCalledWith(
      expect.objectContaining({
        dealId: "d1",
        type: "stage_change",
        previousStage: "Lead",
        newStage: "Qualificato",
      }),
    );
  });

  it("throws if insert returns empty", async () => {
    const chain = {
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([]),
    };
    vi.mocked(db.insert).mockReturnValue(chain as unknown as ReturnType<typeof db.insert>);

    await expect(
      timelineService.recordStageChange("d1", "Lead", "Qualificato", null),
    ).rejects.toThrow();
  });
});
