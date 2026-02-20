import { auth } from "@/server/auth";

export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

export async function isGuest() {
  const user = await getCurrentUser();
  return user?.role === "guest";
}

// Placeholder for Story 8.2 — RBAC enforcement
export async function requireRole(allowedRoles: string[]) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  if (!allowedRoles.includes(user.role)) throw new Error("Forbidden");
  return user;
}
