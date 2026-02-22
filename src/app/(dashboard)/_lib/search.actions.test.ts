/* eslint-disable @typescript-eslint/unbound-method */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { prefetchSearchData } from "./search.actions";

import { db } from "@/server/db";

beforeEach(() => {
  vi.clearAllMocks();
});

function mockSelectChain(data: unknown[]) {
  return { from: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue(data) }) };
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

  it("applies SQL LIMIT per group", async () => {
    const fewContacts = [{ id: "1", firstName: "Mario", lastName: "Rossi", email: null }];
    vi.mocked(db.select)
      .mockReturnValueOnce(mockSelectChain(fewContacts) as unknown as ReturnType<typeof db.select>)
      .mockReturnValueOnce(mockSelectChain([]) as unknown as ReturnType<typeof db.select>)
      .mockReturnValueOnce(mockSelectChain([]) as unknown as ReturnType<typeof db.select>);
    const result = await prefetchSearchData();
    expect(result.contacts).toHaveLength(1);
    expect(db.select).toHaveBeenCalledTimes(3);
  });
});
