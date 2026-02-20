"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

import { signIn } from "@/server/auth";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";

export async function registerUser(data: {
  name: string;
  email: string;
  password: string;
}): Promise<{ error: string } | undefined> {
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, data.email))
    .limit(1);

  if (existing.length > 0) {
    return { error: "Email già registrata" };
  }

  const passwordHash = await bcrypt.hash(data.password, 12);
  await db.insert(users).values({
    name: data.name,
    email: data.email,
    passwordHash,
    role: "member",
  });

  // Auto-login after registration
  await signIn("credentials", {
    email: data.email,
    password: data.password,
    redirect: true,
    redirectTo: "/",
  });
}
