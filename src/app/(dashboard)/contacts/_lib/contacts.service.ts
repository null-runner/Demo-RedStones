import "server-only";

import { eq, ilike, or, sql } from "drizzle-orm";

import type { CreateContactInput, UpdateContactInput } from "./contacts.schema";

import { db } from "@/server/db";
import { companies, contacts, deals } from "@/server/db/schema";
import type { Contact } from "@/server/db/schema";

export type ContactWithCompany = Contact & { companyName: string | null };

async function getAll(searchQuery?: string): Promise<ContactWithCompany[]> {
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

  if (searchQuery && searchQuery.trim().length > 0) {
    const q = `%${searchQuery.trim()}%`;
    return baseQuery.where(
      or(
        ilike(sql`${contacts.firstName} || ' ' || ${contacts.lastName}`, q),
        ilike(contacts.email, q),
        ilike(companies.name, q),
      ),
    );
  }

  return baseQuery;
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
  create,
  update,
  delete: deleteContact,
};
