/* eslint-disable @typescript-eslint/unbound-method */
import { describe, expect, it, vi } from "vitest";

vi.mock("@/server/db", () => ({
  db: {
    delete: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        onConflictDoNothing: vi.fn().mockResolvedValue([]),
        returning: vi.fn().mockResolvedValue([]),
      }),
    }),
    transaction: vi.fn(),
  },
}));

import { generateSeedData, resetDatabase } from "./seed.service";

import { db } from "@/server/db";

const PIPELINE_STAGES = [
  "Lead",
  "Qualificato",
  "Demo",
  "Proposta",
  "Negoziazione",
  "Chiuso Vinto",
  "Chiuso Perso",
] as const;

describe("generateSeedData", () => {
  it("returns arrays for users, companies, contacts, deals, timelineEntries", () => {
    const data = generateSeedData();

    expect(Array.isArray(data.users)).toBe(true);
    expect(Array.isArray(data.companies)).toBe(true);
    expect(Array.isArray(data.contacts)).toBe(true);
    expect(Array.isArray(data.deals)).toBe(true);
    expect(Array.isArray(data.timelineEntries)).toBe(true);
    expect(data.companies.length).toBeGreaterThan(0);
    expect(data.contacts.length).toBeGreaterThan(0);
    expect(data.deals.length).toBeGreaterThan(0);
  });

  it("all companies have required fields: id, name", () => {
    const data = generateSeedData();
    data.companies.forEach((c) => {
      expect(c.id).toBeDefined();
      expect(typeof c.name).toBe("string");
      expect(c.name.length).toBeGreaterThan(0);
    });
  });

  it("all contacts reference a valid companyId", () => {
    const data = generateSeedData();
    const companyIds = new Set(data.companies.map((c) => c.id));
    data.contacts.forEach((c) => {
      if (c.companyId) {
        expect(companyIds.has(c.companyId)).toBe(true);
      }
    });
  });

  it("all deals reference a valid companyId", () => {
    const data = generateSeedData();
    const companyIds = new Set(data.companies.map((c) => c.id));
    data.deals.forEach((d) => {
      if (d.companyId) {
        expect(companyIds.has(d.companyId)).toBe(true);
      }
    });
  });

  it("all dates are within reasonable range (last 90 days)", () => {
    const data = generateSeedData();
    const now = Date.now();
    const ninetyDaysMs = 91 * 24 * 60 * 60 * 1000;

    const allDates = [
      ...data.companies.map((c) => c.createdAt).filter(Boolean),
      ...data.contacts.map((c) => c.createdAt).filter(Boolean),
      ...data.deals.map((d) => d.createdAt).filter(Boolean),
    ] as Date[];

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
  it("calls delete and insert operations inside a transaction", async () => {
    const txDelete = vi.fn().mockReturnThis();
    const txInsert = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        onConflictDoNothing: vi.fn().mockResolvedValue([]),
        returning: vi.fn().mockResolvedValue([]),
      }),
    });
    vi.mocked(db.transaction).mockImplementation(async (fn) => {
      return fn({ delete: txDelete, insert: txInsert } as never);
    });

    await resetDatabase();
    expect(db.transaction).toHaveBeenCalledOnce();
    expect(txDelete).toHaveBeenCalled();
    expect(txInsert).toHaveBeenCalled();
  });
});
