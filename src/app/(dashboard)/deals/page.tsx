import { cookies } from "next/headers";
import { startOfDay, subDays } from "date-fns";

import { DealsClient } from "./_components/deals-client";
import { dealsService } from "./_lib/deals.service";

import { pipelineStagesService } from "@/app/(dashboard)/settings/_lib/pipeline-stages.service";
import { PIPELINE_STAGES } from "@/lib/constants/pipeline";
import { getCompaniesForSelect } from "@/server/services/companies.service";
import { getContactsForSelect } from "@/server/services/contacts.service";
import { getUsersForSelect } from "@/server/services/users.service";

function parseDateRangeCookie(raw: string | undefined): { from: string; to: string } {
  if (raw) {
    try {
      const parsed = JSON.parse(decodeURIComponent(raw)) as { from: string; to: string };
      const from = new Date(parsed.from);
      const to = new Date(parsed.to);
      if (!isNaN(from.getTime()) && !isNaN(to.getTime())) {
        return { from: from.toISOString(), to: to.toISOString() };
      }
    } catch {
      // invalid cookie — fall through to default
    }
  }
  const now = new Date();
  return { from: subDays(startOfDay(now), 89).toISOString(), to: now.toISOString() };
}

export default async function DealsPage() {
  const [deals, companies, contacts, users, dbStages, cookieStore] = await Promise.all([
    dealsService.getAll(),
    getCompaniesForSelect(),
    getContactsForSelect(),
    getUsersForSelect(),
    pipelineStagesService.getAll(),
    cookies(),
  ]);

  const stages = dbStages.length > 0 ? dbStages.map((s) => s.name) : [...PIPELINE_STAGES];
  const dateRange = parseDateRangeCookie(cookieStore.get("dateRange")?.value);

  return (
    <DealsClient
      deals={deals}
      companies={companies}
      contacts={contacts}
      users={users}
      stages={stages}
      initialDateRange={dateRange}
    />
  );
}
