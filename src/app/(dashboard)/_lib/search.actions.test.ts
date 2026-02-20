/* eslint-disable @typescript-eslint/unbound-method */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { prefetchSearchData } from "./search.actions";

import { db } from "@/server/db";

vi.mock("server-only", () => ({}));

beforeEach(() => {
  vi.clearAllMocks();
});

function mockSelectChain(data: unknown[]) {
  return { from: vi.fn().mockResolvedValue(data) };
}

describe("prefetchSearchData", () => {
  it("ritorna oggetto con chiavi contacts, companies, deals", async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(mockSelectChain([]) as unknown as ReturnType<typeof db.select>)
      .mockReturnValueOnce(mockSelectChain([]) as unknown as ReturnType<typeof db.select>)
      .mockReturnValueOnce(mockSelectChain([]) as unknown as ReturnType<typeof db.select>);
    const result = await prefetchSearchData();
    expect(result).toHaveProperty("contacts");
    expect(result).toHaveProperty("companies");
    expect(result).toHaveProperty("deals");
    expect(Array.isArray(result.contacts)).toBe(true);
  });

  it("limita a 200 record totali quando DB ha più di 200 record", async () => {
    const manyContacts = Array.from({ length: 100 }, (_, i) => ({
      id: String(i),
      firstName: "Mario",
      lastName: String(i),
      email: null,
    }));
    const manyCompanies = Array.from({ length: 100 }, (_, i) => ({
      id: String(i),
      name: `Company ${String(i)}`,
      sector: null,
    }));
    const manyDeals = Array.from({ length: 100 }, (_, i) => ({
      id: String(i),
      title: `Deal ${String(i)}`,
      value: "1000.00",
    }));
    vi.mocked(db.select)
      .mockReturnValueOnce(mockSelectChain(manyContacts) as unknown as ReturnType<typeof db.select>)
      .mockReturnValueOnce(
        mockSelectChain(manyCompanies) as unknown as ReturnType<typeof db.select>,
      )
      .mockReturnValueOnce(mockSelectChain(manyDeals) as unknown as ReturnType<typeof db.select>);
    const result = await prefetchSearchData();
    const total = result.contacts.length + result.companies.length + result.deals.length;
    expect(total).toBeLessThanOrEqual(200);
  });
});
