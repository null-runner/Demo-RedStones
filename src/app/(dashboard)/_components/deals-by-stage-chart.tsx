"use client";

import { BarChart2 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { DealsByStageItem } from "../_lib/dashboard.service";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatEUR } from "@/lib/format";

const STAGE_COLORS: Record<string, string> = {
  Lead: "#6366f1",
  Qualificato: "#8b5cf6",
  Demo: "#3b82f6",
  Proposta: "#0ea5e9",
  Negoziazione: "#f59e0b",
};

const DEFAULT_COLOR = "#64748b";

interface Props {
  data: DealsByStageItem[];
}

type ChartItem = DealsByStageItem & { fill: string };

interface TooltipPayloadEntry {
  payload: ChartItem;
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

  const chartData: ChartItem[] = data.map((d) => ({
    ...d,
    fill: STAGE_COLORS[d.stage] ?? DEFAULT_COLOR,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Deal per Stage</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="stage" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
