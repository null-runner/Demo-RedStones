import "server-only";

import { db } from "@/server/db";
import { companies } from "@/server/db/schema";

export async function getCompaniesForSelect(): Promise<Array<{ id: string; name: string }>> {
  return db.select({ id: companies.id, name: companies.name }).from(companies);
}
