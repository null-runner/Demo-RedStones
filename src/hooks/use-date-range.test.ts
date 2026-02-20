import { act, renderHook } from "@testing-library/react";
import { isSameDay, startOfDay, subDays } from "date-fns";
import { afterEach, describe, expect, it } from "vitest";

import { useDateRange } from "./use-date-range";

describe("useDateRange", () => {
  afterEach(() => {
    localStorage.clear();
  });

  it("returns 90-day default when localStorage is empty", () => {
    const { result } = renderHook(() => useDateRange("test"));
    const [value] = result.current;

    const today = startOfDay(new Date());
    const expected90DaysAgo = subDays(today, 89);

    expect(isSameDay(value.from, expected90DaysAgo)).toBe(true);
    expect(isSameDay(value.to, new Date())).toBe(true);
  });

  it("returns saved range when localStorage has valid data", () => {
    const stored = {
      from: new Date("2026-01-01").toISOString(),
      to: new Date("2026-01-31").toISOString(),
    };
    localStorage.setItem("dateRange:test", JSON.stringify(stored));

    const { result } = renderHook(() => useDateRange("test"));
    const [value] = result.current;

    expect(isSameDay(value.from, new Date("2026-01-01"))).toBe(true);
    expect(isSameDay(value.to, new Date("2026-01-31"))).toBe(true);
  });

  it("onChange saves to localStorage", () => {
    const { result } = renderHook(() => useDateRange("test"));
    const newRange = { from: new Date("2026-02-01"), to: new Date("2026-02-15") };

    act(() => {
      result.current[1](newRange);
    });

    const raw = localStorage.getItem("dateRange:test") ?? "";
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw) as { from: string; to: string };
    expect(isSameDay(new Date(parsed.from), newRange.from)).toBe(true);
    expect(isSameDay(new Date(parsed.to), newRange.to)).toBe(true);
  });

  it("falls back to default when localStorage has invalid data", () => {
    localStorage.setItem("dateRange:test", "not-json");

    const { result } = renderHook(() => useDateRange("test"));
    const [value] = result.current;

    const today = startOfDay(new Date());
    expect(isSameDay(value.from, subDays(today, 89))).toBe(true);
  });
});
