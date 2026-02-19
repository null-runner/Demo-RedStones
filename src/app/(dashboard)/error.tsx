"use client";

import { Button } from "@/components/ui/button";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({ reset }: ErrorProps) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4">
      <div className="text-center">
        <h2 className="text-xl font-semibold">Qualcosa è andato storto</h2>
        <p className="text-muted-foreground mt-2 text-sm">
          Si è verificato un errore imprevisto. Per favore riprova.
        </p>
      </div>
      <Button onClick={reset}>Riprova</Button>
    </div>
  );
}
