import { notFound } from "next/navigation";

import { ContactDetail } from "./_components/contact-detail";
import { contactsService } from "../_lib/contacts.service";

export default async function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contact = await contactsService.getById(id);
  if (!contact) notFound();
  return <ContactDetail contact={contact} />;
}
