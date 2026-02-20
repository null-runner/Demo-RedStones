"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod/v3";

import { pipelineStagesService } from "./pipeline-stages.service";

import { requireRole, RBACError } from "@/lib/auth";
import type { ActionResult } from "@/lib/types";
import type { PipelineStageRow } from "@/server/db/schema";

const stageNameSchema = z
  .string()
  .min(1, "Il nome è obbligatorio")
  .max(50, "Nome troppo lungo (max 50 caratteri)");
const stageIdSchema = z.string().uuid("ID stage non valido");

export async function createStage(name: string): Promise<ActionResult<PipelineStageRow>> {
  const parsedName = stageNameSchema.safeParse(name);
  if (!parsedName.success) {
    return { success: false, error: parsedName.error.issues[0]?.message ?? "Nome non valido" };
  }
  try {
    await requireRole(["admin", "guest"]);
  } catch (e) {
    if (e instanceof RBACError) return { success: false, error: e.message };
    return { success: false, error: "Errore di autenticazione" };
  }
  try {
    const stage = await pipelineStagesService.create(parsedName.data);
    revalidatePath("/deals");
    revalidatePath("/settings");
    return { success: true, data: stage };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Errore durante la creazione";
    return { success: false, error: message };
  }
}

export async function renameStage(
  id: string,
  newName: string,
): Promise<ActionResult<PipelineStageRow>> {
  const parsedId = stageIdSchema.safeParse(id);
  const parsedName = stageNameSchema.safeParse(newName);
  if (!parsedId.success)
    return { success: false, error: parsedId.error.issues[0]?.message ?? "ID non valido" };
  if (!parsedName.success)
    return { success: false, error: parsedName.error.issues[0]?.message ?? "Nome non valido" };
  try {
    await requireRole(["admin", "guest"]);
  } catch (e) {
    if (e instanceof RBACError) return { success: false, error: e.message };
    return { success: false, error: "Errore di autenticazione" };
  }
  try {
    const stage = await pipelineStagesService.rename(parsedId.data, parsedName.data);
    revalidatePath("/deals");
    revalidatePath("/settings");
    return { success: true, data: stage };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Errore durante il rinominaggio";
    return { success: false, error: message };
  }
}

export async function reorderStages(orderedIds: string[]): Promise<ActionResult<void>> {
  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    return { success: false, error: "Lista stage non valida" };
  }
  const invalidId = orderedIds.find((id) => !stageIdSchema.safeParse(id).success);
  if (invalidId) {
    return { success: false, error: "ID stage non valido nella lista" };
  }
  try {
    await requireRole(["admin", "guest"]);
  } catch (e) {
    if (e instanceof RBACError) return { success: false, error: e.message };
    return { success: false, error: "Errore di autenticazione" };
  }
  try {
    await pipelineStagesService.reorder(orderedIds);
    revalidatePath("/deals");
    revalidatePath("/settings");
    return { success: true, data: undefined };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Errore durante il riordino";
    return { success: false, error: message };
  }
}

export async function deleteStage(id: string): Promise<ActionResult<void>> {
  const parsedId = stageIdSchema.safeParse(id);
  if (!parsedId.success)
    return { success: false, error: parsedId.error.issues[0]?.message ?? "ID non valido" };
  try {
    await requireRole(["admin", "guest"]);
  } catch (e) {
    if (e instanceof RBACError) return { success: false, error: e.message };
    return { success: false, error: "Errore di autenticazione" };
  }
  try {
    await pipelineStagesService.delete(parsedId.data);
    revalidatePath("/deals");
    revalidatePath("/settings");
    return { success: true, data: undefined };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Errore durante l'eliminazione";
    return { success: false, error: message };
  }
}
