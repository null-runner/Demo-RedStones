"use client";

import { Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import type { CompanyWithDetails } from "../../_lib/companies.service";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type EnrichmentState = {
  status: "not_enriched" | "enriched" | "partial" | "processing";
  description: string | null;
  sector: string | null;
  size: string | null;
  painPoints: string | null;
};

type EnrichmentApiResponse =
  | {
      success: true;
      status: "enriched" | "partial";
      data: {
        description: string | null;
        sector: string | null;
        estimatedSize: string | null;
        painPoints: string[];
      };
    }
  | { success: true; status: "processing" }
  | { success: false; error: string };

const POLL_INTERVAL_MS = 3_000;

function applyEnrichmentData(
  result: Extract<EnrichmentApiResponse, { success: true; data: unknown }>,
): EnrichmentState {
  return {
    status: result.status,
    description: result.data.description,
    sector: result.data.sector,
    size: result.data.estimatedSize,
    painPoints: result.data.painPoints.length > 0 ? result.data.painPoints.join("\n") : null,
  };
}

function EnrichmentDataDisplay({ state }: { state: EnrichmentState }) {
  const painPointsList = state.painPoints ? state.painPoints.split("\n").filter(Boolean) : [];

  return (
    <div className="space-y-2 text-sm">
      <div>
        <span className="font-medium">Descrizione: </span>
        {state.description ?? <span className="text-muted-foreground">— non disponibile</span>}
      </div>
      <div>
        <span className="font-medium">Settore: </span>
        {state.sector ?? <span className="text-muted-foreground">— non disponibile</span>}
      </div>
      <div>
        <span className="font-medium">Dimensione: </span>
        {state.size ?? <span className="text-muted-foreground">— non disponibile</span>}
      </div>
      <div>
        <span className="font-medium">Pain Points: </span>
        {painPointsList.length > 0 ? (
          <ul className="mt-1 list-inside list-disc space-y-1">
            {painPointsList.map((point, i) => (
              <li key={i}>{point}</li>
            ))}
          </ul>
        ) : (
          <span className="text-muted-foreground">— non disponibile</span>
        )}
      </div>
    </div>
  );
}

type EnrichmentSectionProps = {
  company: CompanyWithDetails;
};

export function EnrichmentSection({ company }: EnrichmentSectionProps) {
  const [state, setState] = useState<EnrichmentState>({
    status: company.enrichmentStatus,
    description: company.enrichmentDescription,
    sector: company.enrichmentSector,
    size: company.enrichmentSize,
    painPoints: company.enrichmentPainPoints,
  });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const toastShownRef = useRef(false);

  useEffect(() => {
    if (state.status !== "processing") return;
    if (pollRef.current) return;

    toastShownRef.current = false;

    const stopPoll = () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };

    pollRef.current = setInterval(() => {
      fetch(`/api/enrichment?companyId=${company.id}`)
        .then((res) => {
          if (!res.ok) {
            stopPoll();
            setState((prev) => ({ ...prev, status: "not_enriched" }));
            return null;
          }
          return res.json() as Promise<EnrichmentApiResponse>;
        })
        .then((result) => {
          if (!result) return;
          if (!result.success) {
            stopPoll();
            setState((prev) => ({ ...prev, status: "not_enriched" }));
            return;
          }
          if (result.status !== "processing") {
            stopPoll();
            setState(applyEnrichmentData(result));
            if (!toastShownRef.current) {
              toastShownRef.current = true;
              toast.success("Arricchimento completato!");
            }
          }
        })
        .catch(() => {
          stopPoll();
          setState((prev) => ({ ...prev, status: "not_enriched" }));
        });
    }, POLL_INTERVAL_MS);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [state.status, company.id]);

  async function handleEnrich(force = false) {
    setState((prev) => ({ ...prev, status: "processing" }));
    try {
      const response = await fetch("/api/enrichment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId: company.id, force }),
      });
      const result = (await response.json()) as EnrichmentApiResponse;

      if (result.success && result.status === "processing") {
        return;
      }

      if (result.success) {
        setState(applyEnrichmentData(result));
        return;
      }

      setState((prev) => ({ ...prev, status: "not_enriched" }));
      toast.error("Arricchimento non riuscito: servizio temporaneamente non disponibile.");
    } catch {
      setState((prev) => ({ ...prev, status: "not_enriched" }));
      toast.error("Arricchimento non riuscito: servizio temporaneamente non disponibile.");
    }
  }

  const renderButton = () => {
    if (state.status === "processing") {
      return (
        <Button disabled>
          <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Arricchimento in corso...
        </Button>
      );
    }
    if (state.status === "not_enriched") {
      return (
        <Button
          onClick={() => {
            void handleEnrich();
          }}
        >
          <Sparkles className="mr-2 h-4 w-4" />
          Arricchisci con AI
        </Button>
      );
    }
    return (
      <Button
        variant="outline"
        onClick={() => {
          setShowConfirmDialog(true);
        }}
      >
        Aggiorna dati
      </Button>
    );
  };

  return (
    <div className="bg-card rounded-lg border p-4">
      <h2 className="mb-3 flex items-center gap-2 text-base font-semibold">
        Dati Enrichment
        {state.status === "partial" && (
          <Badge className="bg-yellow-100 text-yellow-800">Dati parziali</Badge>
        )}
        {state.status === "processing" && (
          <Badge className="bg-blue-100 text-blue-800">In elaborazione...</Badge>
        )}
      </h2>

      {state.status === "not_enriched" ? (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <p className="text-muted-foreground text-sm">
            Questa azienda non è ancora stata arricchita con dati AI.
          </p>
          {renderButton()}
        </div>
      ) : state.status === "processing" ? (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <p className="text-muted-foreground text-sm">
            L&apos;AI sta analizzando l&apos;azienda. Puoi navigare liberamente, i dati appariranno
            automaticamente.
          </p>
          {renderButton()}
        </div>
      ) : (
        <div className="space-y-4">
          <EnrichmentDataDisplay state={state} />
          {renderButton()}
        </div>
      )}

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aggiorna dati enrichment?</DialogTitle>
            <DialogDescription>I dati attuali verranno sovrascritti.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowConfirmDialog(false);
              }}
            >
              Annulla
            </Button>
            <Button
              onClick={() => {
                setShowConfirmDialog(false);
                void handleEnrich(true);
              }}
            >
              Aggiorna
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
