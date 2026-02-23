"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod/v3";
import { eq } from "drizzle-orm";

import { timelineService } from "./timeline.service";

import { requireRole, RBACError } from "@/lib/auth";
import type { ActionResult } from "@/lib/types";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import type { TimelineEntry } from "@/server/db/schema";

const addNoteSchema = z.object({
  dealId: z.string().uuid("ID deal non valido"),
  content: z
    .string()
    .min(1, "Inserisci il testo della nota")
    .max(2000, "Nota troppo lunga (max 2000 caratteri)"),
});

export async function addNote(
  dealId: string,
  content: string,
): Promise<ActionResult<TimelineEntry>> {
  const parsed = addNoteSchema.safeParse({ dealId, content });
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
    const [userExists] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);
    const authorId = userExists ? user.id : null;
    const entry = await timelineService.addNote(parsed.data.dealId, parsed.data.content, authorId);
    revalidatePath(`/deals/${parsed.data.dealId}`);
    return { success: true, data: entry };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Errore durante il salvataggio";
    return { success: false, error: message };
  }
}
