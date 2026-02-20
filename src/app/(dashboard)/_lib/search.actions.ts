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

const MAX_RECORDS = 200;

export async function prefetchSearchData(): Promise<SearchDataset> {
  const [rawContacts, rawCompanies, rawDeals] = await Promise.all([
    db
      .select({
        id: contacts.id,
        firstName: contacts.firstName,
        lastName: contacts.lastName,
        email: contacts.email,
      })
      .from(contacts),
    db.select({ id: companies.id, name: companies.name, sector: companies.sector }).from(companies),
    db.select({ id: deals.id, title: deals.title, value: deals.value }).from(deals),
  ]);

  const total = rawContacts.length + rawCompanies.length + rawDeals.length;
  const needsTruncation = total > MAX_RECORDS;
  const perGroup = Math.floor(MAX_RECORDS / 3);

  const contactSlice = needsTruncation ? rawContacts.slice(0, perGroup) : rawContacts;
  const companySlice = needsTruncation ? rawCompanies.slice(0, perGroup) : rawCompanies;
  const dealSlice = needsTruncation ? rawDeals.slice(0, perGroup) : rawDeals;

  return {
    contacts: contactSlice.map((c) => ({
      id: c.id,
      name: `${c.firstName} ${c.lastName}`,
      email: c.email,
    })),
    companies: companySlice.map((c) => ({ id: c.id, name: c.name, sector: c.sector })),
    deals: dealSlice.map((d) => ({ id: d.id, title: d.title, value: d.value })),
  };
}
