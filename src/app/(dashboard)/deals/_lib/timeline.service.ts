import "server-only";

import { desc, eq } from "drizzle-orm";

import { db } from "@/server/db";
import { timelineEntries } from "@/server/db/schema";
import type { TimelineEntry } from "@/server/db/schema";

export type TimelineEntryWithAuthor = TimelineEntry & {
  author: { id: string; name: string | null } | null;
};

async function getByDealId(dealId: string): Promise<TimelineEntryWithAuthor[]> {
  return db.query.timelineEntries.findMany({
    where: eq(timelineEntries.dealId, dealId),
    orderBy: [desc(timelineEntries.createdAt)],
    with: {
      author: {
        columns: { id: true, name: true },
      },
    },
  });
}

async function addNote(
  dealId: string,
  content: string,
  authorId: string | null,
): Promise<TimelineEntry> {
  const result = await db
    .insert(timelineEntries)
    .values({
      dealId,
      type: "note",
      content,
      previousStage: null,
      newStage: null,
      authorId,
    })
    .returning();
  const entry = result[0];
  if (!entry) throw new Error("Errore durante il salvataggio della nota");
  return entry;
}

async function recordStageChange(
  dealId: string,
  previousStage: string,
  newStage: string,
  authorId: string | null,
): Promise<TimelineEntry> {
  const result = await db
    .insert(timelineEntries)
    .values({
      dealId,
      type: "stage_change",
      content: null,
      previousStage,
      newStage,
      authorId,
    })
    .returning();
  const entry = result[0];
  if (!entry) throw new Error("Errore durante la registrazione del cambio stage");
  return entry;
}

export const timelineService = {
  getByDealId,
  addNote,
  recordStageChange,
};
