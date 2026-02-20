import { notFound } from "next/navigation";

import { ContactDetail } from "./_components/contact-detail";
import { contactsService } from "../_lib/contacts.service";

import { companiesService } from "@/app/(dashboard)/companies/_lib/companies.service";

export default async function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [contact, allCompanies, allTags] = await Promise.all([
    contactsService.getById(id),
    companiesService.getAll(),
    contactsService.getAllTags(),
  ]);
  if (!contact) notFound();

  const companies = allCompanies.map((c) => ({ id: c.id, name: c.name }));

  return <ContactDetail contact={contact} companies={companies} allTags={allTags} />;
}
