import { describe, expect, it, vi } from "vitest";

// Mock server-only to prevent Next.js server boundary error in tests
vi.mock("server-only", () => ({}));

// Mock DB before importing the service
vi.mock("@/server/db", () => ({
  db: {
    delete: vi.fn().mockReturnValue({ execute: vi.fn() }),
    insert: vi.fn().mockReturnValue({ values: vi.fn() }),
  },
}));

import { generateSeedData } from "./seed.service";

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
});
