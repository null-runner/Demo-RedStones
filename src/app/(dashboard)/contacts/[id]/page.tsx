import { notFound } from "next/navigation";

import { ContactDetail } from "./_components/contact-detail";
import { contactsService } from "../_lib/contacts.service";

import { companiesService } from "@/app/(dashboard)/companies/_lib/companies.service";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();
  const [contact, allCompanies, allTags] = await Promise.all([
    contactsService.getById(id),
    companiesService.getAll(),
    contactsService.getAllTags(),
  ]);
  if (!contact) notFound();

  const companies = allCompanies.map((c) => ({ id: c.id, name: c.name }));

  return <ContactDetail contact={contact} companies={companies} allTags={allTags} />;
}
