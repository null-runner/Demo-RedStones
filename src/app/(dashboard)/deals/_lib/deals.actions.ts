"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod/v3";

import { createDealSchema, updateDealSchema } from "./deals.schema";
import { dealsService } from "./deals.service";
import { timelineService } from "./timeline.service";

import { requireRole, RBACError } from "@/lib/auth";
import { logger } from "@/lib/logger";
import type { ActionResult } from "@/lib/types";
import type { Deal } from "@/server/db/schema";

export async function createDeal(input: unknown): Promise<ActionResult<Deal>> {
  const parsed = createDealSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dati non validi" };
  }
  try {
    await requireRole(["admin", "member", "guest"]);
  } catch (e) {
    if (e instanceof RBACError) return { success: false, error: e.message };
    return { success: false, error: "Errore di autenticazione" };
  }
  try {
    const deal = await dealsService.create(parsed.data);
    revalidatePath("/deals");
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
  try {
    await requireRole(["admin", "member", "guest"]);
  } catch (e) {
    if (e instanceof RBACError) return { success: false, error: e.message };
    return { success: false, error: "Errore di autenticazione" };
  }
  try {
    const { id, ...rest } = parsed.data;

    // Rileva cambio stage PRIMA dell'update
    let previousStage: string | undefined;
    if (rest.stage !== undefined) {
      const currentDeal = await dealsService.getById(id);
      if (currentDeal && currentDeal.stage !== rest.stage) {
        previousStage = currentDeal.stage;
      }
    }

    const deal = await dealsService.update(id, rest);
    if (!deal) return { success: false, error: "Deal non trovato" };

    if (previousStage !== undefined && rest.stage !== undefined) {
      try {
        await timelineService.recordStageChange(id, previousStage, rest.stage, null);
      } catch (e) {
        logger.error("timeline", "Failed to record stage change", e);
      }
    }

    revalidatePath("/deals");
    revalidatePath(`/deals/${id}`);
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
    return { success: true, data: undefined };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Errore durante l'eliminazione";
    return { success: false, error: message };
  }
}
