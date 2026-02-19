import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function DealNotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      <h2 className="text-2xl font-semibold">Deal non trovato</h2>
      <p className="text-muted-foreground">
        Il deal che stai cercando non esiste o è stato eliminato.
      </p>
      <Button asChild variant="outline">
        <Link href="/deals">Torna alla Pipeline</Link>
      </Button>
    </div>
  );
}
