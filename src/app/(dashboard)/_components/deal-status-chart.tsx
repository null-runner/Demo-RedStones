"use client";

import { PieChart as PieIcon } from "lucide-react";
import { Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import type { DealStatusItem } from "../_lib/dashboard.service";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatEUR } from "@/lib/format";

interface Props {
  data: DealStatusItem[];
}

interface TooltipPayloadEntry {
  payload: DealStatusItem;
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
      <p className="font-medium">{item.status}</p>
      <p>{item.count} deal</p>
      <p>{formatEUR(item.totalValue)}</p>
    </div>
  );
}

export function DealStatusChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Distribuzione Deal</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground flex flex-col items-center justify-center gap-2 py-10">
          <PieIcon className="h-8 w-8" />
          <p>Nessun deal nel periodo</p>
        </CardContent>
      </Card>
    );
  }

  const total = data.reduce((sum, d) => sum + d.count, 0);
  const chartData = data.map((d) => ({ ...d, fill: d.color }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribuzione Deal</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          <ResponsiveContainer width={180} height={180}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="count"
                nameKey="status"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
              />
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-3">
            {data.map((item) => (
              <div key={item.status} className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                <div>
                  <p className="text-sm font-medium">
                    {item.status} ({item.count})
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {Math.round((item.count / total) * 100)}% — {formatEUR(item.totalValue)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
