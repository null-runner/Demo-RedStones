import { CompaniesClient } from "./_components/companies-client";
import { companiesService } from "./_lib/companies.service";

export default async function CompaniesPage() {
  const companies = await companiesService.getAll();
  return <CompaniesClient companies={companies} />;
}
