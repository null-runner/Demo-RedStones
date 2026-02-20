"use client";

import { Building2, LayoutDashboard, Settings, TrendingUp, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Contatti", href: "/contacts", icon: Users },
  { label: "Aziende", href: "/companies", icon: Building2 },
  { label: "Pipeline", href: "/deals", icon: TrendingUp },
  { label: "Impostazioni", href: "/settings", icon: Settings },
] as const;

type SidebarProps = {
  nbaBadgeCount?: number;
};

export function Sidebar({ nbaBadgeCount }: SidebarProps) {
  const pathname = usePathname();

  return (
    <nav className="bg-background h-screen w-64 flex-shrink-0 border-r">
      <div className="flex h-16 items-center border-b px-6">
        <span className="text-lg font-semibold">RedStones CRM</span>
      </div>
      <ul className="space-y-1 p-3">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  isActive && "bg-accent text-accent-foreground font-medium",
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
                {href === "/" && nbaBadgeCount !== undefined && nbaBadgeCount > 0 && (
                  <span className="bg-destructive text-destructive-foreground ml-auto rounded-full px-1.5 py-0.5 text-xs leading-none font-medium">
                    {nbaBadgeCount >= 10 ? "9+" : String(nbaBadgeCount)}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
