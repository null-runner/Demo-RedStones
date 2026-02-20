import { auth } from "@/server/auth";

export class RBACError extends Error {
  readonly statusCode = 403;
  constructor(message = "Azione non consentita per il tuo ruolo") {
    super(message);
    this.name = "RBACError";
  }
}

export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

export async function isGuest() {
  const user = await getCurrentUser();
  return user?.role === "guest";
}

export async function requireRole(allowedRoles: string[]): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new RBACError("Unauthorized");
  if (!allowedRoles.includes(user.role)) throw new RBACError();
}
