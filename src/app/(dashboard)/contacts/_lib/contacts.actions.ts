"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod/v3";

import { createContactSchema, updateContactSchema } from "./contacts.schema";
import { contactsService } from "./contacts.service";

import type { ActionResult } from "@/lib/types";
import type { Contact } from "@/server/db/schema";

export async function createContact(input: unknown): Promise<ActionResult<Contact>> {
  const parsed = createContactSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Input non valido" };
  }
  try {
    const contact = await contactsService.create(parsed.data);
    revalidatePath("/contacts");
    return { success: true, data: contact };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Errore durante la creazione";
    return { success: false, error: message };
  }
}

export async function updateContact(input: unknown): Promise<ActionResult<Contact>> {
  const parsed = updateContactSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Input non valido" };
  }
  try {
    const contact = await contactsService.update(parsed.data);
    revalidatePath("/contacts");
    return { success: true, data: contact };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Errore durante l'aggiornamento";
    return { success: false, error: message };
  }
}

const deleteIdSchema = z.string().uuid("ID non valido");

export async function deleteContact(id: string): Promise<ActionResult<void>> {
  const parsed = deleteIdSchema.safeParse(id);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Input non valido" };
  }
  try {
    await contactsService.delete(parsed.data);
    revalidatePath("/contacts");
    return { success: true, data: undefined };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Errore durante l'eliminazione";
    return { success: false, error: message };
  }
}
