"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { z } from "zod/v3";

import { signIn } from "@/server/auth";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";

const registerSchema = z.object({
  name: z.string().min(1, "Nome richiesto"),
  email: z.string().email("Email non valida"),
  password: z.string().min(8, "La password deve avere almeno 8 caratteri"),
});

export async function registerUser(data: {
  name: string;
  email: string;
  password: string;
}): Promise<{ error: string } | undefined> {
  const parsed = registerSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Input non valido" };
  }

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, parsed.data.email))
    .limit(1);

  if (existing.length > 0) {
    return { error: "Email già registrata" };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  try {
    await db.insert(users).values({
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
      role: "member",
    });
  } catch {
    // Unique constraint violation from race condition
    return { error: "Email già registrata" };
  }

  // Auto-login after registration
  await signIn("credentials", {
    email: parsed.data.email,
    password: parsed.data.password,
    redirect: true,
    redirectTo: "/",
  });
}
