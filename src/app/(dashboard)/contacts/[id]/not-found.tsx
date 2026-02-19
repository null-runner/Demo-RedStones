import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function ContactNotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      <h2 className="text-2xl font-semibold">Contatto non trovato</h2>
      <p className="text-muted-foreground">
        Il contatto che stai cercando non esiste o è stato eliminato.
      </p>
      <Button asChild variant="outline">
        <Link href="/contacts">Torna ai Contatti</Link>
      </Button>
    </div>
  );
}
