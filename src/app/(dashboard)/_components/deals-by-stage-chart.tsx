"use client";

import { BarChart2 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { DealsByStageItem } from "../_lib/dashboard.service";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatEUR } from "@/lib/format";

interface Props {
  data: DealsByStageItem[];
}

interface TooltipPayloadEntry {
  payload: DealsByStageItem;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  const item = payload?.[0]?.payload;
  if (!active || !item) return null;
  return (
    <div className="bg-background rounded-md border p-2 text-sm shadow-md">
      <p className="font-medium">{item.stage}</p>
      <p>{item.count} deal</p>
      <p>{formatEUR(item.totalValue)}</p>
    </div>
  );
}

export function DealsByStageChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Deal per Stage</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground flex flex-col items-center justify-center gap-2 py-10">
          <BarChart2 className="h-8 w-8" />
          <p>Nessun deal in pipeline</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Deal per Stage</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="stage" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
