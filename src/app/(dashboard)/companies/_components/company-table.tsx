import { useEffect, useState } from "react";
import { Building2, Pencil, Trash2 } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Company } from "@/server/db/schema";

type CompanyTableProps = {
  companies: Company[];
  onEdit: (company: Company) => void;
  onDelete: (id: string) => void;
  onViewDetail?: (id: string) => void;
  canWrite?: boolean;
};

const POLL_INTERVAL_MS = 3_000;

function EnrichmentBadge({
  status: initialStatus,
  companyId,
}: {
  status: Company["enrichmentStatus"];
  companyId: string;
}) {
  const [status, setStatus] = useState(initialStatus);

  // Sync with server props when they change (e.g. page navigation)
  useEffect(() => {
    setStatus(initialStatus);
  }, [initialStatus]);

  // Poll enrichment API only while processing
  useEffect(() => {
    if (status !== "processing") return;

    const interval = setInterval(() => {
      fetch(`/api/enrichment?companyId=${companyId}`)
        .then((res) =>
          res.ok ? (res.json() as Promise<{ success: boolean; status?: string }>) : null,
        )
        .then((data) => {
          if (data?.success && data.status && data.status !== "processing") {
            setStatus(data.status as Company["enrichmentStatus"]);
          }
        })
        .catch(() => {
          // ignore network errors, keep polling
        });
    }, POLL_INTERVAL_MS);

    return () => {
      clearInterval(interval);
    };
  }, [status, companyId]);

  if (status === "enriched")
    return <Badge className="border-blue-200 bg-blue-100 text-blue-800">Enriched</Badge>;
  if (status === "processing")
    return (
      <Badge className="animate-pulse border-amber-200 bg-amber-100 text-amber-800">
        Enrichment in corso...
      </Badge>
    );
  if (status === "partial") return <Badge variant="secondary">Partial</Badge>;
  return <Badge variant="outline">Not enriched</Badge>;
}

export function CompanyTable({
  companies,
  onEdit,
  onDelete,
  onViewDetail,
  canWrite = true,
}: CompanyTableProps) {
  if (companies.length === 0) {
    return (
      <EmptyState
        icon={Building2}
        title="Nessuna azienda trovata"
        description="Crea la prima azienda o modifica i filtri di ricerca."
      />
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Dominio</TableHead>
            <TableHead>Settore</TableHead>
            <TableHead>Arricchimento</TableHead>
            <TableHead className="text-right">Azioni</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {companies.map((company) => (
            <TableRow key={company.id} className="hover:bg-muted/50">
              <TableCell className="font-medium">
                {onViewDetail ? (
                  <button
                    type="button"
                    className="hover:underline"
                    onClick={() => {
                      onViewDetail(company.id);
                    }}
                  >
                    {company.name}
                  </button>
                ) : (
                  company.name
                )}
              </TableCell>
              <TableCell className="text-muted-foreground">{company.domain ?? "—"}</TableCell>
              <TableCell className="text-muted-foreground">{company.sector ?? "—"}</TableCell>
              <TableCell>
                <EnrichmentBadge status={company.enrichmentStatus} companyId={company.id} />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      onEdit(company);
                    }}
                    aria-label={`Modifica ${company.name}`}
                    aria-disabled={!canWrite}
                    className={canWrite ? undefined : "opacity-50"}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      onDelete(company.id);
                    }}
                    aria-label={`Elimina ${company.name}`}
                    aria-disabled={!canWrite}
                    className={
                      canWrite
                        ? "text-destructive hover:text-destructive"
                        : "text-destructive opacity-50"
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
