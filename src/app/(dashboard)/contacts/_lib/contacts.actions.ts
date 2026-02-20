"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod/v3";

import { createContactSchema, updateContactSchema } from "./contacts.schema";
import { contactsService } from "./contacts.service";

import { requireRole, RBACError } from "@/lib/auth";
import type { ActionResult } from "@/lib/types";
import { db } from "@/server/db";
import { contactsToTags } from "@/server/db/schema";
import type { Contact } from "@/server/db/schema";

export async function createContact(input: unknown): Promise<ActionResult<Contact>> {
  const parsed = createContactSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Input non valido" };
  }
  try {
    await requireRole(["admin", "member", "guest"]);
  } catch (e) {
    if (e instanceof RBACError) return { success: false, error: e.message };
    return { success: false, error: "Errore di autenticazione" };
  }
  try {
    const contact = await contactsService.create(parsed.data);
    for (const tagName of parsed.data.tagNames) {
      await contactsService.addTagToContact(contact.id, tagName);
    }
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
    await requireRole(["admin", "member", "guest"]);
  } catch (e) {
    if (e instanceof RBACError) return { success: false, error: e.message };
    return { success: false, error: "Errore di autenticazione" };
  }
  try {
    const contact = await contactsService.update(parsed.data);
    if (parsed.data.tagNames !== undefined) {
      const syncResult = await syncContactTags(contact.id, parsed.data.tagNames);
      if (!syncResult.success) {
        return { success: false, error: syncResult.error };
      }
    }
    revalidatePath("/contacts");
    revalidatePath(`/contacts/${contact.id}`);
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
    await requireRole(["admin", "member", "guest"]);
  } catch (e) {
    if (e instanceof RBACError) return { success: false, error: e.message };
    return { success: false, error: "Errore di autenticazione" };
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

export async function syncContactTags(
  contactId: string,
  tagNames: string[],
): Promise<ActionResult<void>> {
  const parsed = z.string().uuid().safeParse(contactId);
  if (!parsed.success) return { success: false, error: "ID contatto non valido" };
  const parsedTags = z.array(z.string().min(1).max(50)).safeParse(tagNames);
  if (!parsedTags.success) return { success: false, error: "Tag non validi" };
  try {
    const current = await db
      .select({ tagId: contactsToTags.tagId })
      .from(contactsToTags)
      .where(eq(contactsToTags.contactId, contactId));
    const currentIds = new Set(current.map((r) => r.tagId));

    const allTagRecords = await contactsService.getAllTags();

    for (const tagName of tagNames) {
      await contactsService.addTagToContact(contactId, tagName);
    }

    const newNames = new Set(tagNames.map((n) => n.trim().toLowerCase()));
    for (const existingTagId of currentIds) {
      const tagRecord = allTagRecords.find((t) => t.id === existingTagId);
      if (tagRecord && !newNames.has(tagRecord.name)) {
        await contactsService.removeTagFromContact(contactId, existingTagId);
      }
    }

    revalidatePath("/contacts");
    revalidatePath(`/contacts/${contactId}`);
    return { success: true, data: undefined };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Errore durante la sincronizzazione tag";
    return { success: false, error: message };
  }
}

export async function checkDuplicateContact(
  companyId: string | null,
  email: string,
  excludeId?: string,
): Promise<ActionResult<{ isDuplicate: boolean; duplicateName?: string }>> {
  try {
    const duplicate = await contactsService.checkDuplicate(companyId, email, excludeId);
    if (duplicate) {
      return {
        success: true,
        data: {
          isDuplicate: true,
          duplicateName: `${duplicate.firstName} ${duplicate.lastName}`,
        },
      };
    }
    return { success: true, data: { isDuplicate: false } };
  } catch {
    return { success: false, error: "Errore durante il controllo duplicati" };
  }
}
