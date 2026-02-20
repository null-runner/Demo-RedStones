"use client";

import { Info } from "lucide-react";
import { useSession } from "next-auth/react";

export function DemoBanner() {
  const { data: session } = useSession();
  if (session?.user.role !== "guest") return null;
  return (
    <div className="flex flex-shrink-0 items-center gap-2 border-b border-yellow-200 bg-yellow-50 px-6 py-2 text-sm text-yellow-800">
      <Info className="h-4 w-4 flex-shrink-0" />
      <span>Stai esplorando in modalità demo — i dati vengono resettati ad ogni sessione</span>
    </div>
  );
}
