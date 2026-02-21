import { auth } from "@/server/auth";

export type UserRole = "admin" | "member" | "guest";

export type AuthenticatedUser = {
  id: string;
  role: UserRole;
  name?: string | null;
  email?: string | null;
};

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

export async function requireRole(allowedRoles: UserRole[]): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();
  if (!user) throw new RBACError("Unauthorized");
  if (!allowedRoles.includes(user.role as UserRole)) throw new RBACError();
  return {
    id: user.id,
    role: user.role as UserRole,
    name: user.name ?? null,
    email: user.email ?? null,
  };
}
