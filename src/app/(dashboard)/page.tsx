import { cookies } from "next/headers";
import { startOfDay, subDays } from "date-fns";

import { DealsByStageChart } from "./_components/deals-by-stage-chart";
import { DealStatusChart } from "./_components/deal-status-chart";
import { KpiCards } from "./_components/kpi-cards";
import { LostDealsBreakdown } from "./_components/lost-deals-breakdown";
import { NbaSuggestions } from "./_components/nba-suggestions";
import { PeriodFilter } from "./_components/period-filter";
import { StagnantDealsList } from "./_components/stagnant-deals-list";
import { customDateRange, dashboardService } from "./_lib/dashboard.service";

function parseDateRangeCookie(raw: string | undefined): { from: Date; to: Date } {
  if (raw) {
    try {
      const parsed = JSON.parse(decodeURIComponent(raw)) as { from: string; to: string };
      const from = new Date(parsed.from);
      const to = new Date(parsed.to);
      if (!isNaN(from.getTime()) && !isNaN(to.getTime())) {
        return { from, to };
      }
    } catch {
      // invalid cookie — fall through to default
    }
  }
  const now = new Date();
  return { from: subDays(startOfDay(now), 89), to: now };
}

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const { from, to } = parseDateRangeCookie(cookieStore.get("dateRange")?.value);
  const period = customDateRange(from, to);

  const [{ kpis, dealsByStage, dealsByStatus, stagnantDeals, lostByReason }, nbaResult] =
    await Promise.all([dashboardService.getDashboardData(period), dashboardService.getNbaData()]);

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
        <DealStatusChart data={dealsByStatus} />
      </div>
      <LostDealsBreakdown data={lostByReason} />
      <StagnantDealsList deals={stagnantDeals} />
      <NbaSuggestions suggestions={nbaResult.suggestions} />
    </div>
  );
}
