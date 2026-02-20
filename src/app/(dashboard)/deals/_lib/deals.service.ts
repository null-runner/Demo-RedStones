import "server-only";

import { desc, eq } from "drizzle-orm";

import type { CreateDealInput, UpdateDealInput } from "./deals.schema";

import { db } from "@/server/db";
import { deals } from "@/server/db/schema";
import type { Deal } from "@/server/db/schema";

export type DealWithDetails = typeof deals.$inferSelect & {
  contact: { id: string; firstName: string; lastName: string; email: string | null } | null;
  company: { id: string; name: string } | null;
  owner: { id: string; name: string | null } | null;
};

async function getAll(): Promise<Deal[]> {
  return db.select().from(deals).orderBy(desc(deals.createdAt));
}

async function getById(id: string): Promise<DealWithDetails | null> {
  const result = await db.query.deals.findFirst({
    where: eq(deals.id, id),
    with: {
      contact: {
        columns: { id: true, firstName: true, lastName: true, email: true },
      },
      company: {
        columns: { id: true, name: true },
      },
      owner: {
        columns: { id: true, name: true },
      },
    },
  });
  return result ?? null;
}

async function create(input: CreateDealInput): Promise<Deal> {
  const result = await db
    .insert(deals)
    .values({
      title: input.title,
      value: input.value.toString(),
      stage: input.stage,
      contactId: input.contactId ?? null,
      companyId: input.companyId ?? null,
      ownerId: input.ownerId ?? null,
    })
    .returning();
  const deal = result[0];
  if (!deal) throw new Error("Errore durante la creazione del deal");
  return deal;
}

async function update(id: string, input: Omit<UpdateDealInput, "id">): Promise<Deal | null> {
  const result = await db
    .update(deals)
    .set({
      ...input,
      value: input.value !== undefined ? input.value.toString() : undefined,
      updatedAt: new Date(),
    })
    .where(eq(deals.id, id))
    .returning();
  return result[0] ?? null;
}

async function deleteDeal(id: string): Promise<void> {
  await db.delete(deals).where(eq(deals.id, id));
}

export const dealsService = {
  getAll,
  getById,
  create,
  update,
  delete: deleteDeal,
};
