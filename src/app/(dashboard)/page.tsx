import { startOfDay, subDays } from "date-fns";

import { DealsByStageChart } from "./_components/deals-by-stage-chart";
import { KpiCards } from "./_components/kpi-cards";
import { NbaSuggestions } from "./_components/nba-suggestions";
import { PeriodFilter } from "./_components/period-filter";
import { StagnantDealsList } from "./_components/stagnant-deals-list";
import { customDateRange, dashboardService } from "./_lib/dashboard.service";
import type { PeriodFilter as PeriodFilterType } from "./_lib/dashboard.service";

function parseSearchParams(params: { from?: string; to?: string }): {
  period: PeriodFilterType;
  from: Date;
  to: Date;
} {
  const now = new Date();
  if (params.from && params.to) {
    const from = new Date(params.from);
    const to = new Date(params.to);
    if (!isNaN(from.getTime()) && !isNaN(to.getTime())) {
      return { period: customDateRange(from, to), from, to };
    }
  }
  const from = subDays(startOfDay(now), 6);
  return { period: customDateRange(from, now), from, to: now };
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const { period, from, to } = parseSearchParams(params);
  const [{ kpis, dealsByStage, stagnantDeals }, nbaResult] = await Promise.all([
    dashboardService.getDashboardData(period),
    dashboardService.getNbaData(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">KPI e overview pipeline</p>
        </div>
        <PeriodFilter from={from.toISOString()} to={to.toISOString()} />
      </div>
      <KpiCards kpis={kpis} />
      <div className="grid gap-6 md:grid-cols-2">
        <DealsByStageChart data={dealsByStage} />
        <StagnantDealsList deals={stagnantDeals} />
      </div>
      <NbaSuggestions suggestions={nbaResult.suggestions} />
    </div>
  );
}
