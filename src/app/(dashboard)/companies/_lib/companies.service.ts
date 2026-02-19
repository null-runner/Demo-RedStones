import "server-only";

import { asc, eq } from "drizzle-orm";

import type { CreateCompanyInput, UpdateCompanyInput } from "./companies.schema";

import { db } from "@/server/db";
import { companies, contacts, deals } from "@/server/db/schema";
import type { Company } from "@/server/db/schema";

async function getAll(): Promise<Company[]> {
  return db.select().from(companies).orderBy(asc(companies.name));
}

async function create(input: CreateCompanyInput): Promise<Company> {
  const domain = input.domain === "" ? null : (input.domain ?? null);
  const result = await db
    .insert(companies)
    .values({ ...input, domain })
    .returning();
  const company = result[0];
  if (!company) throw new Error("Errore durante la creazione dell'azienda");
  return company;
}

async function update(id: string, input: Omit<UpdateCompanyInput, "id">): Promise<Company | null> {
  const domain = input.domain === "" ? null : input.domain;
  const result = await db
    .update(companies)
    .set({ ...input, domain, updatedAt: new Date() })
    .where(eq(companies.id, id))
    .returning();
  return result[0] ?? null;
}

async function deleteCompany(id: string): Promise<void> {
  const [hasContacts, hasDeals] = await Promise.all([
    db.select({ id: contacts.id }).from(contacts).where(eq(contacts.companyId, id)).limit(1),
    db.select({ id: deals.id }).from(deals).where(eq(deals.companyId, id)).limit(1),
  ]);
  if ((hasContacts[0] ?? null) !== null || (hasDeals[0] ?? null) !== null) {
    throw new Error("Impossibile eliminare: l'azienda ha contatti o deal associati");
  }
  await db.delete(companies).where(eq(companies.id, id));
}

export const companiesService = {
  getAll,
  create,
  update,
  delete: deleteCompany,
};
