import { act, renderHook } from "@testing-library/react";
import { isSameDay, startOfDay, subDays } from "date-fns";
import { afterEach, describe, expect, it } from "vitest";

import { useDateRange } from "./use-date-range";

function setCookie(from: Date, to: Date) {
  const value = encodeURIComponent(
    JSON.stringify({ from: from.toISOString(), to: to.toISOString() }),
  );
  document.cookie = `dateRange=${value}; path=/`;
}

function clearCookie() {
  document.cookie = "dateRange=; path=/; max-age=0";
}

describe("useDateRange", () => {
  afterEach(() => {
    clearCookie();
  });

  it("returns 90-day default when no cookie and no initialValue", () => {
    const { result } = renderHook(() => useDateRange());
    const [value] = result.current;

    const today = startOfDay(new Date());
    const expected90DaysAgo = subDays(today, 89);

    expect(isSameDay(value.from, expected90DaysAgo)).toBe(true);
    expect(isSameDay(value.to, new Date())).toBe(true);
  });

  it("returns saved range when cookie has valid data", () => {
    setCookie(new Date("2026-01-01"), new Date("2026-01-31"));

    const { result } = renderHook(() => useDateRange());
    const [value] = result.current;

    expect(isSameDay(value.from, new Date("2026-01-01"))).toBe(true);
    expect(isSameDay(value.to, new Date("2026-01-31"))).toBe(true);
  });

  it("prefers initialValue over cookie when provided", () => {
    setCookie(new Date("2026-01-01"), new Date("2026-01-31"));
    const initial = { from: new Date("2026-02-10"), to: new Date("2026-02-20") };

    const { result } = renderHook(() => useDateRange(initial));
    const [value] = result.current;

    expect(isSameDay(value.from, new Date("2026-02-10"))).toBe(true);
    expect(isSameDay(value.to, new Date("2026-02-20"))).toBe(true);
  });

  it("onChange saves to cookie", () => {
    const { result } = renderHook(() => useDateRange());
    const newRange = { from: new Date("2026-02-01"), to: new Date("2026-02-15") };

    act(() => {
      result.current[1](newRange);
    });

    expect(document.cookie).toContain("dateRange=");
    const match = document.cookie.match(/dateRange=([^;]*)/);
    expect(match?.[1]).toBeTruthy();
    const cookieValue = match?.[1] ?? "";
    const parsed = JSON.parse(decodeURIComponent(cookieValue)) as { from: string; to: string };
    expect(isSameDay(new Date(parsed.from), newRange.from)).toBe(true);
    expect(isSameDay(new Date(parsed.to), newRange.to)).toBe(true);
  });

  it("falls back to default when cookie has invalid data", () => {
    document.cookie = "dateRange=not-valid-json; path=/";

    const { result } = renderHook(() => useDateRange());
    const [value] = result.current;

    const today = startOfDay(new Date());
    expect(isSameDay(value.from, subDays(today, 89))).toBe(true);
  });
});
