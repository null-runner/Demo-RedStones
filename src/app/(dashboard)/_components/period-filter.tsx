"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

import { DateRangePicker, type DateRangeValue } from "@/components/shared/date-range-picker";
import { useDateRange } from "@/hooks/use-date-range";

type Props = {
  from: string;
  to: string;
  hasUrlParams: boolean;
};

export function PeriodFilter({ from, to, hasUrlParams }: Props) {
  const router = useRouter();
  const [savedRange, persistRange] = useDateRange("dashboard");

  useEffect(() => {
    if (hasUrlParams) return;
    if (!localStorage.getItem("dateRange:dashboard")) return;
    const fromParam = format(savedRange.from, "yyyy-MM-dd");
    const toParam = format(savedRange.to, "yyyy-MM-dd");
    router.replace(`/?from=${fromParam}&to=${toParam}`);
  }, [hasUrlParams, savedRange, router]);

  const value: DateRangeValue = {
    from: new Date(from),
    to: new Date(to),
  };

  function handleChange(range: DateRangeValue) {
    persistRange(range);
    const fromParam = format(range.from, "yyyy-MM-dd");
    const toParam = format(range.to, "yyyy-MM-dd");
    router.push(`/?from=${fromParam}&to=${toParam}`);
  }

  return <DateRangePicker value={value} onChange={handleChange} />;
}
