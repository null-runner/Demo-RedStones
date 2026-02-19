"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod/v3";

import { createCompanySchema, updateCompanySchema } from "./companies.schema";
import { companiesService } from "./companies.service";

import type { ActionResult } from "@/lib/types";
import type { Company } from "@/server/db/schema";

export async function createCompany(input: unknown): Promise<ActionResult<Company>> {
  const parsed = createCompanySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dati non validi" };
  }
  try {
    const company = await companiesService.create(parsed.data);
    revalidatePath("/companies");
    return { success: true, data: company };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Errore durante la creazione";
    return { success: false, error: message };
  }
}

export async function updateCompany(input: unknown): Promise<ActionResult<Company>> {
  const parsed = updateCompanySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dati non validi" };
  }
  try {
    const { id, ...rest } = parsed.data;
    const company = await companiesService.update(id, rest);
    if (!company) return { success: false, error: "Azienda non trovata" };
    revalidatePath("/companies");
    return { success: true, data: company };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Errore durante l'aggiornamento";
    return { success: false, error: message };
  }
}

export async function deleteCompany(id: string): Promise<ActionResult<void>> {
  const parsed = z.string().uuid().safeParse(id);
  if (!parsed.success) return { success: false, error: "ID non valido" };
  try {
    await companiesService.delete(id);
    revalidatePath("/companies");
    return { success: true, data: undefined };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Errore durante l'eliminazione";
    return { success: false, error: message };
  }
}
