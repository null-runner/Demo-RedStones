import "server-only";

import { asc, eq } from "drizzle-orm";

import { db } from "@/server/db";
import { deals, pipelineStages } from "@/server/db/schema";
import type { PipelineStageRow } from "@/server/db/schema";
import type { PipelineStage } from "@/lib/constants/pipeline";

const PROTECTED_NAMES = ["Chiuso Vinto", "Chiuso Perso"] as const;

async function getAll(): Promise<PipelineStageRow[]> {
  return db.query.pipelineStages.findMany({
    orderBy: [asc(pipelineStages.sortOrder)],
  });
}

async function create(name: string): Promise<PipelineStageRow> {
  if (PROTECTED_NAMES.includes(name as (typeof PROTECTED_NAMES)[number])) {
    throw new Error(`Il nome "${name}" è riservato e non può essere usato`);
  }
  const all = await getAll();
  const nonProtected = all.filter((s) => !s.isProtected);
  const nextOrder =
    nonProtected.length > 0 ? (nonProtected[nonProtected.length - 1]?.sortOrder ?? 0) + 1 : 1;

  const result = await db.insert(pipelineStages).values({ name, sortOrder: nextOrder }).returning();
  const stage = result[0];
  if (!stage) throw new Error("Errore durante la creazione dello stage");
  return stage;
}

async function rename(id: string, newName: string): Promise<PipelineStageRow> {
  const existing = await db.query.pipelineStages.findFirst({
    where: eq(pipelineStages.id, id),
  });
  if (!existing) throw new Error("Stage non trovato");
  if (existing.isProtected) throw new Error("Stage protetto: non può essere rinominato");

  return db.transaction(async (tx) => {
    await tx
      .update(deals)
      .set({ stage: newName as PipelineStage })
      .where(eq(deals.stage, existing.name as PipelineStage));
    const updated = await tx
      .update(pipelineStages)
      .set({ name: newName })
      .where(eq(pipelineStages.id, id))
      .returning();
    const stage = updated[0];
    if (!stage) throw new Error("Errore durante il rinominaggio");
    return stage;
  });
}

async function reorder(orderedIds: string[]): Promise<void> {
  await db.transaction(async (tx) => {
    for (let i = 0; i < orderedIds.length; i++) {
      const id = orderedIds[i];
      if (!id) continue;
      await tx
        .update(pipelineStages)
        .set({ sortOrder: i + 1 })
        .where(eq(pipelineStages.id, id));
    }
  });
}

async function deleteStage(id: string): Promise<void> {
  const existing = await db.query.pipelineStages.findFirst({
    where: eq(pipelineStages.id, id),
  });
  if (!existing) throw new Error("Stage non trovato");
  if (existing.isProtected) throw new Error("Stage protetto: non può essere eliminato");

  const dealWithStage = await db.query.deals.findFirst({
    where: eq(deals.stage, existing.name as PipelineStage),
  });
  if (dealWithStage) {
    throw new Error("Impossibile eliminare: lo stage ha deal associati");
  }

  await db.delete(pipelineStages).where(eq(pipelineStages.id, id));
}

export const pipelineStagesService = {
  getAll,
  create,
  rename,
  reorder,
  delete: deleteStage,
};
