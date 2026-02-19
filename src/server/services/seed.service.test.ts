import { describe, expect, it, vi } from "vitest";

// Mock server-only to prevent Next.js server boundary error in tests
vi.mock("server-only", () => ({}));

const { mockTransaction } = vi.hoisted(() => {
  const mockTransaction = vi.fn(async (cb: (tx: unknown) => Promise<void>) => {
    await cb({
      delete: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnValue({ values: vi.fn() }),
    });
  });
  return { mockTransaction };
});

// Mock DB before importing the service
vi.mock("@/server/db", () => ({
  db: {
    delete: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        onConflictDoNothing: vi.fn().mockResolvedValue([]),
        returning: vi.fn().mockResolvedValue([]),
      }),
    }),
    transaction: mockTransaction,
  },
}));

import { generateSeedData, resetDatabase } from "./seed.service";

import { PIPELINE_STAGES } from "@/lib/constants/pipeline";

describe("seedService.generateSeedData", () => {
  it("returns exactly 5 companies", () => {
    const data = generateSeedData();
    expect(data.companies).toHaveLength(5);
  });

  it("returns exactly 15 contacts", () => {
    const data = generateSeedData();
    expect(data.contacts).toHaveLength(15);
  });

  it("returns exactly 10 deals", () => {
    const data = generateSeedData();
    expect(data.deals).toHaveLength(10);
  });

  it("returns timeline entries", () => {
    const data = generateSeedData();
    expect(data.timelineEntries.length).toBeGreaterThanOrEqual(20);
  });

  it("has 3 enriched companies", () => {
    const data = generateSeedData();
    const enriched = data.companies.filter((c) => c.enrichmentStatus === "enriched");
    expect(enriched).toHaveLength(3);
  });

  it("has 2 not_enriched companies (RedStones e Eter)", () => {
    const data = generateSeedData();
    const notEnriched = data.companies.filter((c) => c.enrichmentStatus === "not_enriched");
    expect(notEnriched).toHaveLength(2);
    const names = notEnriched.map((c) => c.name);
    expect(names).toContain("RedStones");
    expect(names).toContain("Eter Biometric Technologies");
  });

  it("has guest user with null password", () => {
    const data = generateSeedData();
    const guest = data.users.find((u) => u.role === "guest");
    expect(guest).toBeDefined();
    expect(guest?.passwordHash).toBeNull();
  });

  it("all deal dates are relative Date instances (not hardcoded strings)", () => {
    const data = generateSeedData();
    data.deals.forEach((d) => {
      expect(d.createdAt).toBeInstanceOf(Date);
    });
  });

  it("all timeline entries are Date instances", () => {
    const data = generateSeedData();
    data.timelineEntries.forEach((e) => {
      expect(e.createdAt).toBeInstanceOf(Date);
    });
  });

  it("dates are relative to now, not hardcoded constants", () => {
    const data = generateSeedData();
    const now = Date.now();
    const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;
    const allDates = [
      ...data.deals.map((d) => d.createdAt),
      ...data.timelineEntries.map((e) => e.createdAt),
      ...data.companies.map((c) => c.createdAt),
    ].filter((d): d is Date => d instanceof Date);

    allDates.forEach((date) => {
      const diff = Math.abs(now - date.getTime());
      expect(diff).toBeLessThan(ninetyDaysMs);
    });
  });

  it("all deal stages are valid PipelineStage values", () => {
    const data = generateSeedData();
    const validStages = new Set<string>(PIPELINE_STAGES);
    data.deals.forEach((d) => {
      expect(validStages.has(d.stage)).toBe(true);
    });
  });
});

describe("seedService.resetDatabase", () => {
  it("executes within a transaction", async () => {
    await resetDatabase();
    expect(mockTransaction).toHaveBeenCalledOnce();
  });
});
