import { KpiCards } from "./_components/kpi-cards";
import { dashboardService } from "./_lib/dashboard.service";

export default async function DashboardPage() {
  const kpis = await dashboardService.getDashboardKPIs();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">KPI e overview pipeline</p>
      </div>
      <KpiCards kpis={kpis} />
    </div>
  );
}
