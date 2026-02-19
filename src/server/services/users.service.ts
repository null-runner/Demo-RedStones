import "server-only";

import { asc } from "drizzle-orm";

import { db } from "@/server/db";
import { users } from "@/server/db/schema";

export async function getUsersForSelect(): Promise<Array<{ id: string; name: string }>> {
  return db.select({ id: users.id, name: users.name }).from(users).orderBy(asc(users.name));
}
