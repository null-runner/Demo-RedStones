import "server-only";

import { and, asc, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";

import type { CreateContactInput, UpdateContactInput } from "./contacts.schema";

import { db } from "@/server/db";
import {
  companies,
  contacts,
  contactsToTags,
  deals,
  tags as tagsTable,
  timelineEntries,
} from "@/server/db/schema";
import type { Contact } from "@/server/db/schema";

export type ContactWithCompany = Contact & { companyName: string | null };
export type ContactWithCompanyAndTags = ContactWithCompany & {
  tags: Array<{ id: string; name: string }>;
};
export type ContactWithDetails = Contact & {
  companyName: string | null;
  companyDomain: string | null;
  tags: Array<{ id: string; name: string }>;
  deals: Array<{ id: string; title: string; value: string; stage: string; createdAt: Date }>;
  recentActivity: Array<{
    id: string;
    type: string;
    content: string | null;
    newStage: string | null;
    createdAt: Date;
  }>;
};

async function getAll(searchQuery?: string): Promise<ContactWithCompanyAndTags[]> {
  const baseQuery = db
    .select({
      id: contacts.id,
      firstName: contacts.firstName,
      lastName: contacts.lastName,
      email: contacts.email,
      phone: contacts.phone,
      role: contacts.role,
      companyId: contacts.companyId,
      createdAt: contacts.createdAt,
      updatedAt: contacts.updatedAt,
      companyName: companies.name,
    })
    .from(contacts)
    .leftJoin(companies, eq(contacts.companyId, companies.id));

  let result: ContactWithCompany[];

  if (searchQuery && searchQuery.trim().length > 0) {
    const q = `%${searchQuery.trim()}%`;
    result = await baseQuery.where(
      or(
        ilike(sql`${contacts.firstName} || ' ' || ${contacts.lastName}`, q),
        ilike(contacts.email, q),
        ilike(companies.name, q),
      ),
    );
  } else {
    result = await baseQuery;
  }

  const contactIds = result.map((c) => c.id);
  const tagAssignments =
    contactIds.length > 0
      ? await db
          .select({
            contactId: contactsToTags.contactId,
            tagId: contactsToTags.tagId,
            tagName: tagsTable.name,
          })
          .from(contactsToTags)
          .innerJoin(tagsTable, eq(contactsToTags.tagId, tagsTable.id))
          .where(inArray(contactsToTags.contactId, contactIds))
      : [];

  const tagsByContactId = tagAssignments.reduce<
    Record<string, Array<{ id: string; name: string }>>
  >((acc, row) => {
    const tagList = (acc[row.contactId] ??= []);
    tagList.push({ id: row.tagId, name: row.tagName });
    return acc;
  }, {});

  return result.map((c) => ({ ...c, tags: tagsByContactId[c.id] ?? [] }));
}

async function getById(id: string): Promise<ContactWithDetails | null> {
  const contact = await db.query.contacts.findFirst({
    where: eq(contacts.id, id),
    with: {
      tags: { with: { tag: true } },
    },
  });
  if (!contact) return null;

  const company = contact.companyId
    ? await db.query.companies.findFirst({ where: eq(companies.id, contact.companyId) })
    : null;

  const contactDeals = await db
    .select({
      id: deals.id,
      title: deals.title,
      value: deals.value,
      stage: deals.stage,
      createdAt: deals.createdAt,
    })
    .from(deals)
    .where(eq(deals.contactId, id));

  let recentActivity: ContactWithDetails["recentActivity"] = [];
  if (contactDeals.length > 0) {
    const dealIds = contactDeals.map((d) => d.id);
    recentActivity = await db
      .select({
        id: timelineEntries.id,
        type: timelineEntries.type,
        content: timelineEntries.content,
        newStage: timelineEntries.newStage,
        createdAt: timelineEntries.createdAt,
      })
      .from(timelineEntries)
      .where(inArray(timelineEntries.dealId, dealIds))
      .orderBy(desc(timelineEntries.createdAt))
      .limit(5);
  }

  return {
    ...contact,
    companyName: company?.name ?? null,
    companyDomain: company?.domain ?? null,
    tags: contact.tags.map((ct) => ({ id: ct.tag.id, name: ct.tag.name })),
    deals: contactDeals,
    recentActivity,
  };
}

async function getAllTags(): Promise<Array<{ id: string; name: string }>> {
  return db
    .select({ id: tagsTable.id, name: tagsTable.name })
    .from(tagsTable)
    .orderBy(asc(tagsTable.name));
}

async function addTagToContact(
  contactId: string,
  tagName: string,
): Promise<{ id: string; name: string }> {
  const normalizedName = tagName.trim().toLowerCase();
  let tag = await db.query.tags.findFirst({ where: eq(tagsTable.name, normalizedName) });
  if (!tag) {
    const inserted = await db.insert(tagsTable).values({ name: normalizedName }).returning();
    tag = inserted[0];
    if (!tag) throw new Error("Errore durante la creazione del tag");
  }
  await db.insert(contactsToTags).values({ contactId, tagId: tag.id }).onConflictDoNothing();
  return { id: tag.id, name: tag.name };
}

async function removeTagFromContact(contactId: string, tagId: string): Promise<void> {
  await db
    .delete(contactsToTags)
    .where(and(eq(contactsToTags.contactId, contactId), eq(contactsToTags.tagId, tagId)));
}

async function checkDuplicate(
  companyId: string | null,
  email: string,
  excludeId?: string,
): Promise<{ id: string; firstName: string; lastName: string } | null> {
  if (!companyId || !email || !email.includes("@")) return null;
  const domain = email.split("@")[1];
  if (!domain) return null;
  const escapedDomain = domain.replace(/[%_\\]/g, "\\$&");
  const results = await db
    .select({ id: contacts.id, firstName: contacts.firstName, lastName: contacts.lastName })
    .from(contacts)
    .where(and(eq(contacts.companyId, companyId), ilike(contacts.email, `%@${escapedDomain}`)));
  const found = results.find((c) => c.id !== excludeId);
  return found ?? null;
}

async function create(input: CreateContactInput): Promise<Contact> {
  let rows: Contact[];
  try {
    rows = await db
      .insert(contacts)
      .values({
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email || null,
        phone: input.phone || null,
        role: input.role || null,
        companyId: input.companyId ?? null,
      })
      .returning();
  } catch (e) {
    if (e instanceof Error && e.message.includes("foreign key")) {
      throw new Error("Azienda selezionata non trovata");
    }
    throw e;
  }

  const contact = rows[0];
  if (!contact) throw new Error("Errore durante la creazione del contatto");
  return contact;
}

async function update(input: UpdateContactInput): Promise<Contact> {
  const { id, ...data } = input;

  const rows = await db
    .update(contacts)
    .set({
      ...(data.firstName !== undefined && { firstName: data.firstName }),
      ...(data.lastName !== undefined && { lastName: data.lastName }),
      ...(data.email !== undefined && { email: data.email || null }),
      ...(data.phone !== undefined && { phone: data.phone || null }),
      ...(data.role !== undefined && { role: data.role || null }),
      ...(data.companyId !== undefined && { companyId: data.companyId }),
      updatedAt: new Date(),
    })
    .where(eq(contacts.id, id))
    .returning();

  const contact = rows[0];
  if (!contact) throw new Error("Contatto non trovato");
  return contact;
}

async function deleteContact(id: string): Promise<void> {
  const associatedDeals = await db.select().from(deals).where(eq(deals.contactId, id));

  if (associatedDeals.length > 0) {
    throw new Error("Impossibile eliminare: il contatto ha deal associati");
  }

  await db.delete(contacts).where(eq(contacts.id, id));
}

export const contactsService = {
  getAll,
  getById,
  getAllTags,
  addTagToContact,
  removeTagFromContact,
  checkDuplicate,
  create,
  update,
  delete: deleteContact,
};
