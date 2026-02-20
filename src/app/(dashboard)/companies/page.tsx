import { CompaniesClient } from "./_components/companies-client";
import { companiesService } from "./_lib/companies.service";

import { contactsService } from "@/app/(dashboard)/contacts/_lib/contacts.service";

export default async function CompaniesPage() {
  const [companies, allTags] = await Promise.all([
    companiesService.getAll(),
    contactsService.getAllTags(),
  ]);
  return <CompaniesClient companies={companies} allTags={allTags} />;
}
