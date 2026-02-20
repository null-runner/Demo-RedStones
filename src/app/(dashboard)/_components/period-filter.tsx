"use client";

import { useRouter } from "next/navigation";

import { DateRangePicker, type DateRangeValue } from "@/components/shared/date-range-picker";
import { useDateRange } from "@/hooks/use-date-range";

type Props = {
  from: string;
  to: string;
};

export function PeriodFilter({ from, to }: Props) {
  const router = useRouter();
  const initialValue: DateRangeValue = { from: new Date(from), to: new Date(to) };
  const [value, onChange] = useDateRange(initialValue);

  function handleChange(range: DateRangeValue) {
    onChange(range);
    router.refresh();
  }

  return <DateRangePicker value={value} onChange={handleChange} />;
}
