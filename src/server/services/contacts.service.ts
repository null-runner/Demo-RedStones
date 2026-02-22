import "server-only";

import { asc } from "drizzle-orm";

import { db } from "@/server/db";
import { contacts } from "@/server/db/schema";

export async function getContactsForSelect(): Promise<
  Array<{ id: string; firstName: string; lastName: string; companyId: string | null }>
> {
  return db
    .select({
      id: contacts.id,
      firstName: contacts.firstName,
      lastName: contacts.lastName,
      companyId: contacts.companyId,
    })
    .from(contacts)
    .orderBy(asc(contacts.firstName));
}
