"use client";

import { DemoModeBadge } from "./demo-mode-badge";

import type { SearchDataset } from "@/app/(dashboard)/_lib/search.actions";
import { CommandMenu } from "@/components/shared/command-menu";

type TopbarProps = { searchDataset: SearchDataset };

export function Topbar({ searchDataset }: TopbarProps) {
  return (
    <header className="flex h-16 flex-shrink-0 items-center justify-between border-b px-6">
      <CommandMenu dataset={searchDataset} />
      <DemoModeBadge />
    </header>
  );
}
