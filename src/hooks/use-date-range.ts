"use client";

import { useCallback, useState } from "react";
import { startOfDay, subDays } from "date-fns";

import type { DateRangeValue } from "@/components/shared/date-range-picker";

const STORAGE_PREFIX = "dateRange:";

function getDefault90Days(): DateRangeValue {
  const now = new Date();
  return { from: subDays(startOfDay(now), 89), to: now };
}

function readFromStorage(key: string): DateRangeValue | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { from: string; to: string };
    const from = new Date(parsed.from);
    const to = new Date(parsed.to);
    if (isNaN(from.getTime()) || isNaN(to.getTime())) return null;
    return { from, to };
  } catch {
    return null;
  }
}

function writeToStorage(key: string, range: DateRangeValue): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      `${STORAGE_PREFIX}${key}`,
      JSON.stringify({ from: range.from.toISOString(), to: range.to.toISOString() }),
    );
  } catch {
    // localStorage full or disabled — silently ignore
  }
}

export function useDateRange(moduleKey: string): [DateRangeValue, (range: DateRangeValue) => void] {
  const [value, setValue] = useState<DateRangeValue>(() => {
    return readFromStorage(moduleKey) ?? getDefault90Days();
  });

  const onChange = useCallback(
    (range: DateRangeValue) => {
      setValue(range);
      writeToStorage(moduleKey, range);
    },
    [moduleKey],
  );

  return [value, onChange];
}
