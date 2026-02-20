"use client";

import { useRouter } from "next/navigation";
import { Pencil, Trash2, TrendingUp } from "lucide-react";

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
import { EmptyState } from "@/components/shared/empty-state";
import { formatEUR } from "@/lib/format";
import type { Deal } from "@/server/db/schema";

type DealTableProps = {
  deals: Deal[];
  onEdit: (deal: Deal) => void;
  onDelete: (id: string) => void;
  canWrite?: boolean;
};

export function DealTable({ deals, onEdit, onDelete, canWrite = true }: DealTableProps) {
  const router = useRouter();

  if (deals.length === 0) {
    return (
      <EmptyState
        icon={TrendingUp}
        title="Nessun deal"
        description="Crea il tuo primo deal con il bottone 'Nuovo Deal'."
      />
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Titolo</TableHead>
            <TableHead>Stage</TableHead>
            <TableHead>Valore</TableHead>
            <TableHead>Data Creazione</TableHead>
            <TableHead className="w-[100px]">Azioni</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deals.map((deal) => (
            <TableRow
              key={deal.id}
              className="cursor-pointer"
              onClick={() => {
                router.push(`/deals/${deal.id}`);
              }}
            >
              <TableCell className="font-medium">{deal.title}</TableCell>
              <TableCell>
                <Badge variant="outline">{deal.stage}</Badge>
              </TableCell>
              <TableCell>{formatEUR(parseFloat(deal.value))}</TableCell>
              <TableCell>{deal.createdAt.toLocaleDateString("it-IT")}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(deal);
                    }}
                    aria-label="Modifica"
                    aria-disabled={!canWrite}
                    className={canWrite ? undefined : "opacity-50"}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(deal.id);
                    }}
                    aria-label="Elimina"
                    aria-disabled={!canWrite}
                    className={canWrite ? undefined : "opacity-50"}
                  >
                    <Trash2 className="text-destructive h-4 w-4" />
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
