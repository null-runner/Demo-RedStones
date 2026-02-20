import "server-only";

import bcrypt from "bcryptjs";
import { desc, eq } from "drizzle-orm";

import { db } from "@/server/db";
import { users } from "@/server/db/schema";

export type UserRow = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "member" | "guest";
  createdAt: Date;
  invitedAt: Date | null;
};

async function getAllUsers(): Promise<UserRow[]> {
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
      invitedAt: users.invitedAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt));
}

async function inviteUser(email: string, role: "admin" | "member"): Promise<UserRow> {
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing.length > 0) {
    throw new Error("Email già registrata nel sistema");
  }

  const tempPassword = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  const passwordHash = await bcrypt.hash(tempPassword, 10);
  const name = email.split("@")[0] ?? email;

  const result = await db
    .insert(users)
    .values({ name, email, passwordHash, role, invitedAt: new Date() })
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
      invitedAt: users.invitedAt,
    });

  const created = result[0];
  if (!created) throw new Error("Failed to create user");

  return created;
}

async function deleteUser(targetId: string, currentUserId: string): Promise<void> {
  if (targetId === currentUserId) throw new Error("SELF_DELETE");

  await db.transaction(async (tx) => {
    const admins = await tx.select({ id: users.id }).from(users).where(eq(users.role, "admin"));

    const targetIsAdmin = admins.some((a) => a.id === targetId);
    if (targetIsAdmin && admins.length <= 1) throw new Error("LAST_ADMIN");

    await tx.delete(users).where(eq(users.id, targetId));
  });
}

export const usersService = { getAllUsers, inviteUser, deleteUser };
