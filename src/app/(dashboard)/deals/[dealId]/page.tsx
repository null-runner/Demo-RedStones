import { notFound } from "next/navigation";

import { DealDetail } from "../_components/deal-detail";
import { dealsService } from "../_lib/deals.service";
import { getSuggestionsForDeal } from "../../_lib/nba.service";
import { timelineService } from "../_lib/timeline.service";

import { getCompaniesForSelect } from "@/server/services/companies.service";
import { getContactsForSelect } from "@/server/services/contacts.service";
import { getUsersForSelect } from "@/server/services/users.service";

export default async function DealDetailPage({ params }: { params: Promise<{ dealId: string }> }) {
  const { dealId } = await params;

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(dealId)) {
    notFound();
  }

  const [deal, companies, contacts, users, timelineEntries] = await Promise.all([
    dealsService.getById(dealId),
    getCompaniesForSelect(),
    getContactsForSelect(),
    getUsersForSelect(),
    timelineService.getByDealId(dealId),
  ]);

  if (!deal) notFound();

  const nbaSuggestions = getSuggestionsForDeal(deal, timelineEntries);

  return (
    <DealDetail
      deal={deal}
      companies={companies}
      contacts={contacts}
      users={users}
      timelineEntries={timelineEntries}
      nbaSuggestions={nbaSuggestions}
    />
  );
}
