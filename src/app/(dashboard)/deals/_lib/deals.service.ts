import "server-only";

import { desc, eq } from "drizzle-orm";

import type { CreateDealInput, UpdateDealInput } from "./deals.schema";

import { db } from "@/server/db";
import { deals } from "@/server/db/schema";
import type { Deal } from "@/server/db/schema";

async function getAll(): Promise<Deal[]> {
  return db.select().from(deals).orderBy(desc(deals.createdAt));
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
  // timeline_entries si eliminano in cascade (onDelete: "cascade" in schema)
  await db.delete(deals).where(eq(deals.id, id));
}

export const dealsService = {
  getAll,
  create,
  update,
  delete: deleteDeal,
};
