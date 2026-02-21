"use client";

import { Pencil, Sparkles, TriangleAlert } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { updateEnrichment } from "../../_lib/companies.actions";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type EnrichmentState = {
  status: "not_enriched" | "enriched" | "partial" | "processing";
  description: string | null;
  sector: string | null;
  size: string | null;
  painPoints: string | null;
};

type EditForm = {
  description: string;
  sector: string;
  size: string;
  painPoints: string;
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

const SIZE_OPTIONS = ["1-10", "11-50", "51-200", "200+"] as const;

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

function EnrichmentEditForm({
  form,
  onChange,
  onSave,
  onCancel,
  isSaving,
}: {
  form: EditForm;
  onChange: (field: keyof EditForm, value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor="enrichment-description">Descrizione</Label>
        <Textarea
          id="enrichment-description"
          value={form.description}
          onChange={(e) => {
            onChange("description", e.target.value);
          }}
          rows={3}
          disabled={isSaving}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="enrichment-sector">Settore</Label>
        <Input
          id="enrichment-sector"
          value={form.sector}
          onChange={(e) => {
            onChange("sector", e.target.value);
          }}
          disabled={isSaving}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="enrichment-size">Dimensione</Label>
        <Select
          value={form.size || "_none"}
          onValueChange={(v) => {
            onChange("size", v === "_none" ? "" : v);
          }}
          disabled={isSaving}
        >
          <SelectTrigger id="enrichment-size">
            <SelectValue placeholder="Seleziona dimensione" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_none">— non specificata</SelectItem>
            {SIZE_OPTIONS.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt} dipendenti
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="enrichment-painpoints">Pain Points (uno per riga)</Label>
        <Textarea
          id="enrichment-painpoints"
          value={form.painPoints}
          onChange={(e) => {
            onChange("painPoints", e.target.value);
          }}
          rows={4}
          disabled={isSaving}
        />
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={onSave} disabled={isSaving}>
          {isSaving ? "Salvataggio..." : "Salva"}
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel} disabled={isSaving}>
          Annulla
        </Button>
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
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<EditForm>({
    description: "",
    sector: "",
    size: "",
    painPoints: "",
  });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isSaving, startTransition] = useTransition();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const toastShownRef = useRef(false);

  const canEdit = state.status === "enriched" || state.status === "partial";

  function startEditing() {
    setEditForm({
      description: state.description ?? "",
      sector: state.sector ?? "",
      size: state.size ?? "",
      painPoints: state.painPoints ?? "",
    });
    setIsEditing(true);
  }

  function cancelEditing() {
    setIsEditing(false);
  }

  function handleEditChange(field: keyof EditForm, value: string) {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSave() {
    startTransition(async () => {
      const result = await updateEnrichment({
        id: company.id,
        enrichmentDescription: editForm.description.trim() || null,
        enrichmentSector: editForm.sector.trim() || null,
        enrichmentSize: editForm.size || null,
        enrichmentPainPoints: editForm.painPoints.trim() || null,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setState({
        status: result.data.enrichmentStatus,
        description: result.data.enrichmentDescription,
        sector: result.data.enrichmentSector,
        size: result.data.enrichmentSize,
        painPoints: result.data.enrichmentPainPoints,
      });
      setIsEditing(false);
      toast.success("Dati enrichment aggiornati");
    });
  }

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

  const hasDomain = Boolean(company.domain);

  const renderDomainWarning = () => {
    if (hasDomain) return null;
    return (
      <p className="text-muted-foreground flex items-center gap-1 text-xs">
        <TriangleAlert className="h-3 w-3 shrink-0 text-yellow-600" />
        Senza dominio i risultati potrebbero essere imprecisi.
      </p>
    );
  };

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
        Rigenera con AI
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
        {canEdit && !isEditing && (
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto h-7 gap-1 px-2 text-xs"
            onClick={startEditing}
          >
            <Pencil className="h-3 w-3" />
            Modifica
          </Button>
        )}
      </h2>

      {state.status === "not_enriched" ? (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <p className="text-muted-foreground text-sm">
            Questa azienda non è ancora stata arricchita con dati AI.
          </p>
          {renderButton()}
          {renderDomainWarning()}
        </div>
      ) : state.status === "processing" ? (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <p className="text-muted-foreground text-sm">
            L&apos;AI sta analizzando l&apos;azienda. Puoi navigare liberamente, i dati appariranno
            automaticamente.
          </p>
          {renderButton()}
        </div>
      ) : isEditing ? (
        <EnrichmentEditForm
          form={editForm}
          onChange={handleEditChange}
          onSave={handleSave}
          onCancel={cancelEditing}
          isSaving={isSaving}
        />
      ) : (
        <div className="space-y-4">
          <EnrichmentDataDisplay state={state} />
          <div className="flex items-center gap-3">
            {renderButton()}
            {renderDomainWarning()}
          </div>
        </div>
      )}

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rigenerare dati con AI?</DialogTitle>
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
              Rigenera
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
