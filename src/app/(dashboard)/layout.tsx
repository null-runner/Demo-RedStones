import { dashboardService } from "./_lib/dashboard.service";
import { prefetchSearchData } from "./_lib/search.actions";

import { DemoBanner } from "@/components/layout/demo-banner";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [nbaResult, searchDataset] = await Promise.all([
    dashboardService.getNbaData(),
    prefetchSearchData(),
  ]);
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar nbaBadgeCount={nbaResult.totalCount} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar searchDataset={searchDataset} />
        <DemoBanner />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
