import { DealsByStageChart } from "./_components/deals-by-stage-chart";
import { KpiCards } from "./_components/kpi-cards";
import { StagnantDealsList } from "./_components/stagnant-deals-list";
import { dashboardService } from "./_lib/dashboard.service";

export default async function DashboardPage() {
  const { kpis, dealsByStage, stagnantDeals } = await dashboardService.getDashboardData();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">KPI e overview pipeline</p>
      </div>
      <KpiCards kpis={kpis} />
      <div className="grid gap-6 md:grid-cols-2">
        <DealsByStageChart data={dealsByStage} />
        <StagnantDealsList deals={stagnantDeals} />
      </div>
    </div>
  );
}
