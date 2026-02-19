import { Minus, TrendingDown, TrendingUp } from "lucide-react";

import type { DashboardKPIs, WinRateTrend } from "../_lib/dashboard.service";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatEUR } from "@/lib/format";

interface KpiCardsProps {
  kpis: DashboardKPIs;
}

function TrendIndicator({ trend }: { trend: WinRateTrend }) {
  const { direction, delta } = trend;
  const formatted = delta.toFixed(1);
  const label = direction === "up" ? `+${formatted}pp` : `${formatted}pp`;

  if (direction === "up") {
    return (
      <span className="flex items-center gap-1 text-sm text-green-600">
        <TrendingUp className="h-4 w-4" />
        {label}
      </span>
    );
  }

  if (direction === "down") {
    return (
      <span className="flex items-center gap-1 text-sm text-red-600">
        <TrendingDown className="h-4 w-4" />
        {label}
      </span>
    );
  }

  return (
    <span className="text-muted-foreground flex items-center gap-1 text-sm">
      <Minus className="h-4 w-4" />
      {label}
    </span>
  );
}

export function KpiCards({ kpis }: KpiCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{formatEUR(kpis.pipelineValue)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{kpis.winRate.toFixed(1)}%</p>
          <TrendIndicator trend={kpis.winRateTrend} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Pipeline Velocity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{formatEUR(kpis.velocity)}</p>
          <p className="text-muted-foreground text-xs">per giorno</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Deal Vinti</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{formatEUR(kpis.wonDealsValue)}</p>
          <p className="text-muted-foreground text-sm">{kpis.wonDealsCount} deal</p>
        </CardContent>
      </Card>
    </div>
  );
}
