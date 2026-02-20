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
  guest: [],
};

export function usePermission(action: PermissionAction): boolean {
  const { data: session } = useSession();
  const role = (session?.user as { role?: string } | undefined)?.role ?? "guest";
  return PERMISSIONS[role]?.includes(action) ?? false;
}
