"use client";

import { useRouter } from "next/navigation";

import type { PeriodFilter } from "../_lib/dashboard.service";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  value: PeriodFilter;
}

export function PeriodFilter({ value }: Props) {
  const router = useRouter();

  function handleChange(newPeriod: string) {
    if (newPeriod === "current-month") {
      router.push("/");
    } else {
      router.push(`/?period=${newPeriod}`);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground text-sm">Periodo:</span>
      <Select
        value={value}
        onValueChange={(v) => {
          handleChange(v);
        }}
      >
        <SelectTrigger className="w-[180px]" aria-label="Periodo">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="current-month">Mese corrente</SelectItem>
          <SelectItem value="prev-month">Mese precedente</SelectItem>
          <SelectItem value="last-90-days">Ultimi 90 giorni</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
