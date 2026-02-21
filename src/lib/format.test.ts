import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { formatEUR, formatRelativeDate, sumCurrency, toCents } from "./format";

describe("formatEUR", () => {
  it("formats number as EUR currency", () => {
    const result = formatEUR(15000);
    expect(result).toMatch(/15[\.\,]000/);
  });

  it("formats zero", () => {
    const result = formatEUR(0);
    expect(result).toMatch(/0/);
  });

  it("formats NaN as zero", () => {
    const result = formatEUR(NaN);
    expect(result).toMatch(/0/);
    expect(result).not.toContain("NaN");
  });
});

describe("toCents", () => {
  it("converts string value to integer cents", () => {
    expect(toCents("50.25")).toBe(5025);
  });

  it("returns 0 for NaN input", () => {
    expect(toCents("not-a-number")).toBe(0);
  });

  it("returns 0 for empty string", () => {
    expect(toCents("")).toBe(0);
  });
});

describe("sumCurrency", () => {
  it("sums valid string values", () => {
    expect(sumCurrency(["10.50", "20.25"])).toBe(30.75);
  });

  it("treats NaN values as 0", () => {
    expect(sumCurrency(["10.00", "invalid", "5.00"])).toBe(15);
  });
});

describe("formatRelativeDate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-15T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 'pochi secondi fa' for dates less than 60 seconds ago", () => {
    const date = new Date("2026-02-15T11:59:30Z");
    expect(formatRelativeDate(date)).toBe("pochi secondi fa");
  });

  it("returns 'pochi secondi fa' for future dates", () => {
    const date = new Date("2026-02-15T13:00:00Z");
    expect(formatRelativeDate(date)).toBe("pochi secondi fa");
  });

  it("returns '1 minuto fa' for exactly 1 minute ago", () => {
    const date = new Date("2026-02-15T11:59:00Z");
    expect(formatRelativeDate(date)).toBe("1 minuto fa");
  });

  it("returns 'N minuti fa' for minutes", () => {
    const date = new Date("2026-02-15T11:25:00Z");
    expect(formatRelativeDate(date)).toBe("35 minuti fa");
  });

  it("returns '1 ora fa' for exactly 1 hour ago", () => {
    const date = new Date("2026-02-15T11:00:00Z");
    expect(formatRelativeDate(date)).toBe("1 ora fa");
  });

  it("returns 'N ore fa' for hours", () => {
    const date = new Date("2026-02-15T06:00:00Z");
    expect(formatRelativeDate(date)).toBe("6 ore fa");
  });

  it("returns 'ieri' for exactly 1 day ago", () => {
    const date = new Date("2026-02-14T12:00:00Z");
    expect(formatRelativeDate(date)).toBe("ieri");
  });

  it("returns 'N giorni fa' for days", () => {
    const date = new Date("2026-02-11T12:00:00Z");
    expect(formatRelativeDate(date)).toBe("4 giorni fa");
  });

  it("returns '1 settimana fa' for 7 days ago", () => {
    const date = new Date("2026-02-08T12:00:00Z");
    expect(formatRelativeDate(date)).toBe("1 settimana fa");
  });

  it("returns 'N settimane fa' for weeks", () => {
    const date = new Date("2026-01-29T12:00:00Z");
    expect(formatRelativeDate(date)).toBe("2 settimane fa");
  });

  it("returns '4 settimane fa' for 28 days ago (not 0 mesi)", () => {
    const date = new Date("2026-01-18T12:00:00Z");
    expect(formatRelativeDate(date)).toBe("4 settimane fa");
  });

  it("returns '1 mese fa' for 30 days ago", () => {
    const date = new Date("2026-01-16T12:00:00Z");
    expect(formatRelativeDate(date)).toBe("1 mese fa");
  });

  it("returns 'N mesi fa' for months", () => {
    const date = new Date("2025-12-15T12:00:00Z");
    expect(formatRelativeDate(date)).toBe("2 mesi fa");
  });
});
