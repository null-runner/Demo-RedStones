"use client";

import { useCallback, useState } from "react";
import { startOfDay, subDays } from "date-fns";

import type { DateRangeValue } from "@/components/shared/date-range-picker";

const COOKIE_NAME = "dateRange";
const MAX_AGE = 60 * 60 * 24 * 365;

function getDefault90Days(): DateRangeValue {
  const now = new Date();
  return { from: subDays(startOfDay(now), 89), to: now };
}

function readCookie(): DateRangeValue | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|; )dateRange=([^;]*)/);
  if (!match?.[1]) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(match[1])) as { from: string; to: string };
    const from = new Date(parsed.from);
    const to = new Date(parsed.to);
    if (isNaN(from.getTime()) || isNaN(to.getTime())) return null;
    return { from, to };
  } catch {
    return null;
  }
}

function writeCookie(range: DateRangeValue): void {
  if (typeof document === "undefined") return;
  const value = encodeURIComponent(
    JSON.stringify({ from: range.from.toISOString(), to: range.to.toISOString() }),
  );
  document.cookie = `${COOKIE_NAME}=${value}; path=/; max-age=${String(MAX_AGE)}; SameSite=Lax`;
}

export function useDateRange(
  initialValue?: DateRangeValue,
): [DateRangeValue, (range: DateRangeValue) => void] {
  const [value, setValue] = useState<DateRangeValue>(() => {
    return initialValue ?? readCookie() ?? getDefault90Days();
  });

  const onChange = useCallback((range: DateRangeValue) => {
    setValue(range);
    writeCookie(range);
  }, []);

  return [value, onChange];
}
