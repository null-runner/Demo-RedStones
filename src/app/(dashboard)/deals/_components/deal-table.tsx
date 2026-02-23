"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ArrowDown, ArrowUp, ArrowUpDown, Pencil, Trash2, TrendingUp } from "lucide-react";

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
import { PIPELINE_STAGES } from "@/lib/constants/pipeline";
import { formatEUR, toCents } from "@/lib/format";
import type { Deal } from "@/server/db/schema";

type SortKey = "title" | "stage" | "value" | "createdAt";
type SortDir = "asc" | "desc";

const stageOrder = new Map<string, number>(PIPELINE_STAGES.map((s, i) => [s, i]));

type DealTableProps = {
  deals: Deal[];
  onEdit: (deal: Deal) => void;
  onDelete: (id: string) => void;
  canWrite?: boolean;
};

export function DealTable({ deals, onEdit, onDelete, canWrite = true }: DealTableProps) {
  const router = useRouter();
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "title" ? "asc" : "desc");
    }
  };

  const sorted = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;
    return [...deals].sort((a, b) => {
      switch (sortKey) {
        case "title":
          return dir * a.title.localeCompare(b.title, "it");
        case "stage":
          return dir * ((stageOrder.get(a.stage) ?? 99) - (stageOrder.get(b.stage) ?? 99));
        case "value":
          return dir * (toCents(a.value) - toCents(b.value));
        case "createdAt":
          return dir * (a.createdAt.getTime() - b.createdAt.getTime());
      }
    });
  }, [deals, sortKey, sortDir]);

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
            {(
              [
                ["title", "Titolo"],
                ["stage", "Stage"],
                ["value", "Valore"],
                ["createdAt", "Data Creazione"],
              ] as const
            ).map(([key, label]) => {
              const active = sortKey === key;
              const Icon = active ? (sortDir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
              return (
                <TableHead key={key}>
                  <button
                    type="button"
                    className="hover:text-foreground inline-flex items-center gap-1"
                    onClick={() => {
                      toggleSort(key);
                    }}
                  >
                    {label}
                    <Icon
                      className={`h-3.5 w-3.5 ${active ? "text-foreground" : "text-muted-foreground"}`}
                    />
                  </button>
                </TableHead>
              );
            })}
            <TableHead className="w-[100px]">Azioni</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((deal) => (
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
              <TableCell>{format(deal.createdAt, "dd/MM/yyyy")}</TableCell>
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
