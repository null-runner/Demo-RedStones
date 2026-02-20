"use client";

import { LogOut, User } from "lucide-react";
import { signOut, useSession } from "next-auth/react";

import { DemoModeBadge } from "./demo-mode-badge";

import type { SearchDataset } from "@/app/(dashboard)/_lib/search.actions";
import { Button } from "@/components/ui/button";
import { CommandMenu } from "@/components/shared/command-menu";

type TopbarProps = { searchDataset: SearchDataset };

export function Topbar({ searchDataset }: TopbarProps) {
  const { data: session } = useSession();

  return (
    <header className="flex h-16 flex-shrink-0 items-center justify-between border-b px-6">
      <CommandMenu dataset={searchDataset} />
      <div className="flex items-center gap-3">
        {session?.user.role === "guest" && <DemoModeBadge />}
        {session?.user && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground flex items-center gap-1.5 text-sm">
              <User className="h-4 w-4" />
              {session.user.name ?? session.user.email}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                void signOut({ redirectTo: "/sign-in" });
              }}
              className="gap-1.5"
            >
              <LogOut className="h-4 w-4" />
              Esci
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
