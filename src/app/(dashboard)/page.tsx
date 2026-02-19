export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">KPI e overview pipeline</p>
      </div>
      <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-dashed">
        <div className="text-center">
          <p className="text-muted-foreground text-sm">
            KPI e metriche verranno aggiunti in Epic 5.
          </p>
        </div>
      </div>
    </div>
  );
}
