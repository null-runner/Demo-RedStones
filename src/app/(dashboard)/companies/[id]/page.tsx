import { notFound } from "next/navigation";

import { companiesService } from "../_lib/companies.service";
import { CompanyDetail } from "./_components/company-detail";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();
  const company = await companiesService.getById(id);
  if (!company) notFound();
  return <CompanyDetail company={company} />;
}
