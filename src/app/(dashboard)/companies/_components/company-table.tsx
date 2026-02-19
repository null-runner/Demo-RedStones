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
};

function EnrichmentBadge({ status }: { status: Company["enrichmentStatus"] }) {
  if (status === "enriched")
    return <Badge className="border-blue-200 bg-blue-100 text-blue-800">Enriched</Badge>;
  if (status === "partial") return <Badge variant="secondary">Partial</Badge>;
  return <Badge variant="outline">Not enriched</Badge>;
}

export function CompanyTable({ companies, onEdit, onDelete }: CompanyTableProps) {
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
              <TableCell className="font-medium">{company.name}</TableCell>
              <TableCell className="text-muted-foreground">{company.domain ?? "—"}</TableCell>
              <TableCell className="text-muted-foreground">{company.sector ?? "—"}</TableCell>
              <TableCell>
                <EnrichmentBadge status={company.enrichmentStatus} />
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
                    className="text-destructive hover:text-destructive"
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
