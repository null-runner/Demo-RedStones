import { DealsByStageChart } from "./_components/deals-by-stage-chart";
import { KpiCards } from "./_components/kpi-cards";
import { PeriodFilter } from "./_components/period-filter";
import { StagnantDealsList } from "./_components/stagnant-deals-list";
import { dashboardService } from "./_lib/dashboard.service";
import type { PeriodFilter as PeriodFilterType } from "./_lib/dashboard.service";

function parsePeriod(period?: string): PeriodFilterType {
  if (period === "prev-month" || period === "last-90-days") return period;
  return "current-month";
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period: periodParam } = await searchParams;
  const period = parsePeriod(periodParam);
  const { kpis, dealsByStage, stagnantDeals } = await dashboardService.getDashboardData(period);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">KPI e overview pipeline</p>
        </div>
        <PeriodFilter value={period} />
      </div>
      <KpiCards kpis={kpis} />
      <div className="grid gap-6 md:grid-cols-2">
        <DealsByStageChart data={dealsByStage} />
        <StagnantDealsList deals={stagnantDeals} />
      </div>
    </div>
  );
}
