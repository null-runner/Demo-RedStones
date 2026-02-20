import "server-only";

import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

import { authConfig } from "./config";

import { db } from "@/server/db";
import { users } from "@/server/db/schema";

export async function authorizeCredentials(credentials: { email: string; password: string }) {
  const result = await db.select().from(users).where(eq(users.email, credentials.email)).limit(1);
  const user = result[0];
  if (!user?.passwordHash) return null;
  const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
  if (!isValid) return null;
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  // Cast needed due to @auth/core version mismatch (0.41.0 vs 0.41.1 in pnpm)
  adapter: DrizzleAdapter(db) as unknown as NonNullable<NextAuthConfig["adapter"]>,
  providers: [
    Credentials({
      async authorize(credentials) {
        const { email, password } = credentials as { email: string; password: string };
        return authorizeCredentials({ email, password });
      },
    }),
  ],
});
