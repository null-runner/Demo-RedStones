import { notFound } from "next/navigation";

import { companiesService } from "../_lib/companies.service";
import { CompanyDetail } from "./_components/company-detail";

export default async function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const company = await companiesService.getById(id);
  if (!company) notFound();
  return <CompanyDetail company={company} />;
}
