"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod/v3";

import { createContactSchema, updateContactSchema } from "./contacts.schema";
import { contactsService } from "./contacts.service";

import { requireRole, RBACError } from "@/lib/auth";
import type { ActionResult } from "@/lib/types";
import { db } from "@/server/db";
import { contacts, contactsToTags, tags as tagsTable } from "@/server/db/schema";
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
    const contact = await db.transaction(async (tx) => {
      let rows: Contact[];
      try {
        rows = await tx
          .insert(contacts)
          .values({
            firstName: parsed.data.firstName,
            lastName: parsed.data.lastName,
            email: parsed.data.email || null,
            phone: parsed.data.phone || null,
            role: parsed.data.role || null,
            companyId: parsed.data.companyId ?? null,
          })
          .returning();
      } catch (e) {
        if (e instanceof Error && e.message.includes("foreign key")) {
          throw new Error("Azienda selezionata non trovata");
        }
        throw e;
      }
      const created = rows[0];
      if (!created) throw new Error("Errore durante la creazione del contatto");

      for (const tagName of parsed.data.tagNames) {
        await contactsService.addTagToContact(created.id, tagName);
      }
      return created;
    });
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
    await requireRole(["admin", "member", "guest"]);
  } catch (e) {
    if (e instanceof RBACError) return { success: false, error: e.message };
    return { success: false, error: "Errore di autenticazione" };
  }
  try {
    await db.transaction(async (tx) => {
      const newNames = tagNames.map((n) => n.trim().toLowerCase()).filter(Boolean);

      // Batch: resolve all tag names to IDs (create missing ones)
      const tagIds: string[] = [];
      for (const name of newNames) {
        let tag = await tx.query.tags.findFirst({ where: eq(tagsTable.name, name) });
        if (!tag) {
          const inserted = await tx.insert(tagsTable).values({ name }).returning();
          tag = inserted[0];
          if (!tag) throw new Error("Errore creazione tag");
        }
        tagIds.push(tag.id);
      }

      // Batch: get current assignments
      const current = await tx
        .select({ tagId: contactsToTags.tagId })
        .from(contactsToTags)
        .where(eq(contactsToTags.contactId, contactId));
      const currentIds = new Set(current.map((r) => r.tagId));
      const newIdSet = new Set(tagIds);

      // Batch insert: new assignments
      const toAdd = tagIds.filter((id) => !currentIds.has(id));
      if (toAdd.length > 0) {
        await tx
          .insert(contactsToTags)
          .values(toAdd.map((tagId) => ({ contactId, tagId })))
          .onConflictDoNothing();
      }

      // Batch delete: removed assignments
      const toRemove = [...currentIds].filter((id) => !newIdSet.has(id));
      if (toRemove.length > 0) {
        await tx
          .delete(contactsToTags)
          .where(
            and(eq(contactsToTags.contactId, contactId), inArray(contactsToTags.tagId, toRemove)),
          );
      }
    });

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
    await requireRole(["admin", "member", "guest"]);
  } catch (e) {
    if (e instanceof RBACError) return { success: false, error: e.message };
    return { success: false, error: "Errore di autenticazione" };
  }
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
