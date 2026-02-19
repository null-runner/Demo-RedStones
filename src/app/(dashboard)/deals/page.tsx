import { DealsClient } from "./_components/deals-client";
import { dealsService } from "./_lib/deals.service";

import { getCompaniesForSelect } from "@/server/services/companies.service";
import { getContactsForSelect } from "@/server/services/contacts.service";
import { getUsersForSelect } from "@/server/services/users.service";

export default async function DealsPage() {
  const [deals, companies, contacts, users] = await Promise.all([
    dealsService.getAll(),
    getCompaniesForSelect(),
    getContactsForSelect(),
    getUsersForSelect(),
  ]);

  return <DealsClient deals={deals} companies={companies} contacts={contacts} users={users} />;
}
