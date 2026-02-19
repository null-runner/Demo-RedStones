import { ContactsClient } from "./_components/contacts-client";
import { contactsService } from "./_lib/contacts.service";

import { getCompaniesForSelect } from "@/server/services/companies.service";

export default async function ContactsPage() {
  const [contacts, companies, allTags] = await Promise.all([
    contactsService.getAll(),
    getCompaniesForSelect(),
    contactsService.getAllTags(),
  ]);

  return <ContactsClient contacts={contacts} companies={companies} allTags={allTags} />;
}
