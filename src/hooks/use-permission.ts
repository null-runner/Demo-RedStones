"use client";

import { useSession } from "next-auth/react";

export type PermissionAction =
  | "create:contacts"
  | "update:contacts"
  | "delete:contacts"
  | "create:companies"
  | "update:companies"
  | "delete:companies"
  | "create:deals"
  | "update:deals"
  | "delete:deals"
  | "manage:settings"
  | "manage:users";

const PERMISSIONS: Record<string, PermissionAction[]> = {
  admin: [
    "create:contacts",
    "update:contacts",
    "delete:contacts",
    "create:companies",
    "update:companies",
    "delete:companies",
    "create:deals",
    "update:deals",
    "delete:deals",
    "manage:settings",
    "manage:users",
  ],
  member: [
    "create:contacts",
    "update:contacts",
    "delete:contacts",
    "create:companies",
    "update:companies",
    "delete:companies",
    "create:deals",
    "update:deals",
    "delete:deals",
  ],
  guest: [
    "create:contacts",
    "update:contacts",
    "delete:contacts",
    "create:companies",
    "update:companies",
    "delete:companies",
    "create:deals",
    "update:deals",
    "delete:deals",
  ],
};

export function usePermission(action: PermissionAction): boolean {
  const { data: session } = useSession();
  if (!session?.user) return false;
  const role = (session.user as { role?: string }).role ?? "guest";
  return PERMISSIONS[role]?.includes(action) ?? false;
}
