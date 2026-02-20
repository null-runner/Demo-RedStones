import { DealsClient } from "./_components/deals-client";
import { dealsService } from "./_lib/deals.service";

import { pipelineStagesService } from "@/app/(dashboard)/settings/_lib/pipeline-stages.service";
import { PIPELINE_STAGES } from "@/lib/constants/pipeline";
import { getCompaniesForSelect } from "@/server/services/companies.service";
import { getContactsForSelect } from "@/server/services/contacts.service";
import { getUsersForSelect } from "@/server/services/users.service";

export default async function DealsPage() {
  const [deals, companies, contacts, users, dbStages] = await Promise.all([
    dealsService.getAll(),
    getCompaniesForSelect(),
    getContactsForSelect(),
    getUsersForSelect(),
    pipelineStagesService.getAll(),
  ]);

  const stages = dbStages.length > 0 ? dbStages.map((s) => s.name) : [...PIPELINE_STAGES];

  return (
    <DealsClient
      deals={deals}
      companies={companies}
      contacts={contacts}
      users={users}
      stages={stages}
    />
  );
}
