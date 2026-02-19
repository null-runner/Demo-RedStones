import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function CompanyNotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      <h2 className="text-2xl font-semibold">Azienda non trovata</h2>
      <p className="text-muted-foreground">
        {"L'azienda che stai cercando non esiste o è stata eliminata."}
      </p>
      <Button asChild variant="outline">
        <Link href="/companies">Torna alle Aziende</Link>
      </Button>
    </div>
  );
}
