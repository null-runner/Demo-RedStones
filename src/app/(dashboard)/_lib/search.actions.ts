import "server-only";

import { db } from "@/server/db";
import { contacts, companies, deals } from "@/server/db/schema";

export type SearchContact = { id: string; name: string; email: string | null };
export type SearchCompany = { id: string; name: string; sector: string | null };
export type SearchDeal = { id: string; title: string; value: string };
export type SearchDataset = {
  contacts: SearchContact[];
  companies: SearchCompany[];
  deals: SearchDeal[];
};

const MAX_PER_GROUP = 66;

export async function prefetchSearchData(): Promise<SearchDataset> {
  const [rawContacts, rawCompanies, rawDeals] = await Promise.all([
    db
      .select({
        id: contacts.id,
        firstName: contacts.firstName,
        lastName: contacts.lastName,
        email: contacts.email,
      })
      .from(contacts)
      .limit(MAX_PER_GROUP),
    db
      .select({ id: companies.id, name: companies.name, sector: companies.sector })
      .from(companies)
      .limit(MAX_PER_GROUP),
    db
      .select({ id: deals.id, title: deals.title, value: deals.value })
      .from(deals)
      .limit(MAX_PER_GROUP),
  ]);

  return {
    contacts: rawContacts.map((c) => ({
      id: c.id,
      name: `${c.firstName} ${c.lastName}`,
      email: c.email,
    })),
    companies: rawCompanies.map((c) => ({ id: c.id, name: c.name, sector: c.sector })),
    deals: rawDeals.map((d) => ({ id: d.id, title: d.title, value: d.value })),
  };
}
