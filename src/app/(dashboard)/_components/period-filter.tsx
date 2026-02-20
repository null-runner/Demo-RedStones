"use client";

import { useRouter } from "next/navigation";
import { format } from "date-fns";

import { DateRangePicker, type DateRangeValue } from "@/components/shared/date-range-picker";

type Props = {
  from: string;
  to: string;
};

export function PeriodFilter({ from, to }: Props) {
  const router = useRouter();

  const value: DateRangeValue = {
    from: new Date(from),
    to: new Date(to),
  };

  function handleChange(range: DateRangeValue) {
    const fromParam = format(range.from, "yyyy-MM-dd");
    const toParam = format(range.to, "yyyy-MM-dd");
    router.push(`/?from=${fromParam}&to=${toParam}`);
  }

  return <DateRangePicker value={value} onChange={handleChange} />;
}
