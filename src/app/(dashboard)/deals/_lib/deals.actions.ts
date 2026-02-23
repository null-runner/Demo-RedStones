"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod/v3";

import { createDealSchema, updateDealSchema } from "./deals.schema";
import { dealsService } from "./deals.service";

import { requireRole, RBACError } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { triggerEvent } from "@/lib/pusher";
import { DEALS_CHANNEL } from "@/lib/pusher-events";
import type { ActionResult } from "@/lib/types";
import { db } from "@/server/db";
import { deals, pipelineStages, timelineEntries } from "@/server/db/schema";
import type { Deal } from "@/server/db/schema";

export async function createDeal(input: unknown): Promise<ActionResult<Deal>> {
  const parsed = createDealSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dati non validi" };
  }
  let user;
  try {
    user = await requireRole(["admin", "member", "guest"]);
  } catch (e) {
    if (e instanceof RBACError) return { success: false, error: e.message };
    return { success: false, error: "Errore di autenticazione" };
  }
  try {
    if (parsed.data.stage) {
      const validStages = await db.select({ name: pipelineStages.name }).from(pipelineStages);
      const stageNames = validStages.map((s) => s.name);
      if (!stageNames.includes(parsed.data.stage)) {
        return { success: false, error: "Stage non valido" };
      }
    }
    const deal = await dealsService.create(parsed.data);

    try {
      await db.insert(timelineEntries).values({
        dealId: deal.id,
        type: "stage_change",
        content: null,
        previousStage: null,
        newStage: deal.stage,
        authorId: user.id,
      });
    } catch (e) {
      logger.error("timeline", "Failed to record deal creation", e);
    }

    revalidatePath("/deals");
    await triggerEvent(DEALS_CHANNEL, "deal:created", { type: "deal:created", deal });
    return { success: true, data: deal };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Errore durante la creazione";
    return { success: false, error: message };
  }
}

export async function updateDeal(input: unknown): Promise<ActionResult<Deal>> {
  const parsed = updateDealSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dati non validi" };
  }
  let user;
  try {
    user = await requireRole(["admin", "member", "guest"]);
  } catch (e) {
    if (e instanceof RBACError) return { success: false, error: e.message };
    return { success: false, error: "Errore di autenticazione" };
  }
  try {
    const { id, ...rest } = parsed.data;

    if (rest.stage !== undefined) {
      const validStages = await db.select({ name: pipelineStages.name }).from(pipelineStages);
      const stageNames = validStages.map((s) => s.name);
      if (!stageNames.includes(rest.stage)) {
        return { success: false, error: "Stage non valido" };
      }
    }

    const currentRows = await db.select().from(deals).where(eq(deals.id, id)).limit(1);
    const currentDeal = currentRows[0];
    if (!currentDeal) return { success: false, error: "Deal non trovato" };

    const previousStage =
      rest.stage !== undefined && currentDeal.stage !== rest.stage ? currentDeal.stage : undefined;

    const lostReasonValue = previousStage === "Chiuso Perso" ? null : rest.lostReason;

    const updatedRows = await db
      .update(deals)
      .set({
        ...rest,
        value: rest.value !== undefined ? rest.value.toString() : undefined,
        lostReason: lostReasonValue,
        updatedAt: new Date(),
      })
      .where(eq(deals.id, id))
      .returning();
    const deal = updatedRows[0];
    if (!deal) return { success: false, error: "Deal non trovato" };

    if (previousStage !== undefined && rest.stage !== undefined) {
      try {
        await db.insert(timelineEntries).values({
          dealId: id,
          type: "stage_change",
          content: null,
          previousStage,
          newStage: rest.stage,
          authorId: user.id,
        });
      } catch (e) {
        logger.error("timeline", "Failed to record stage change", e);
      }
    }

    revalidatePath("/deals");
    revalidatePath(`/deals/${id}`);
    await triggerEvent(DEALS_CHANNEL, "deal:updated", { type: "deal:updated", deal });
    return { success: true, data: deal };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Errore durante l'aggiornamento";
    return { success: false, error: message };
  }
}

export async function deleteDeal(id: string): Promise<ActionResult<void>> {
  const parsed = z.string().uuid().safeParse(id);
  if (!parsed.success) return { success: false, error: "ID non valido" };
  try {
    await requireRole(["admin", "member", "guest"]);
  } catch (e) {
    if (e instanceof RBACError) return { success: false, error: e.message };
    return { success: false, error: "Errore di autenticazione" };
  }
  try {
    await dealsService.delete(parsed.data);
    revalidatePath("/deals");
    revalidatePath(`/deals/${parsed.data}`);
    await triggerEvent(DEALS_CHANNEL, "deal:deleted", {
      type: "deal:deleted",
      dealId: parsed.data,
    });
    return { success: true, data: undefined };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Errore durante l'eliminazione";
    return { success: false, error: message };
  }
}
