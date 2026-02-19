"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { deleteDeal } from "../_lib/deals.actions";
import { DealSheet } from "./deal-sheet";
import { DealTable } from "./deal-table";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PIPELINE_STAGES } from "@/lib/constants/pipeline";
import type { Deal } from "@/server/db/schema";

const PERIOD_OPTIONS = [
  { value: "all", label: "Tutti i periodi" },
  { value: "30d", label: "Ultimi 30 giorni" },
  { value: "90d", label: "Ultimi 90 giorni" },
] as const;

type DealsClientProps = {
  deals: Deal[];
  companies: Array<{ id: string; name: string }>;
  contacts: Array<{ id: string; firstName: string; lastName: string }>;
  users: Array<{ id: string; name: string }>;
};

export function DealsClient({ deals, companies, contacts, users }: DealsClientProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [ownerFilter, setOwnerFilter] = useState<string>("all");
  const [minValue, setMinValue] = useState("");
  const [periodFilter, setPeriodFilter] = useState<string>("all");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const now = new Date();
    return deals.filter((deal) => {
      if (query.trim() && !deal.title.toLowerCase().includes(query.toLowerCase())) return false;
      if (stageFilter !== "all" && deal.stage !== stageFilter) return false;
      if (ownerFilter !== "all" && deal.ownerId !== ownerFilter) return false;
      const numVal = parseFloat(deal.value);
      if (minValue !== "" && numVal < parseFloat(minValue)) return false;
      if (periodFilter === "30d") {
        const cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        if (deal.createdAt < cutoff) return false;
      }
      if (periodFilter === "90d") {
        const cutoff = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        if (deal.createdAt < cutoff) return false;
      }
      return true;
    });
  }, [deals, query, stageFilter, ownerFilter, minValue, periodFilter]);

  const handleEdit = (deal: Deal) => {
    setEditingDeal(deal);
    setSheetOpen(true);
  };

  const handleNewDeal = () => {
    setEditingDeal(null);
    setSheetOpen(true);
  };

  const handleSheetOpenChange = (open: boolean) => {
    setSheetOpen(open);
    if (!open) setEditingDeal(null);
  };

  const handleDeleteConfirm = () => {
    if (!deletingId) return;
    startTransition(async () => {
      const result = await deleteDeal(deletingId);
      if (!result.success) {
        toast.error(result.error);
      } else {
        toast.success("Deal eliminato");
        router.refresh();
      }
      setDeletingId(null);
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pipeline"
        description="Gestisci le opportunità commerciali"
        action={
          <Button onClick={handleNewDeal}>
            <Plus className="mr-2 h-4 w-4" />
            Nuovo Deal
          </Button>
        }
      />

      {/* Filtri */}
      <div className="bg-muted/50 rounded-lg border p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <div className="space-y-1">
            <Label className="text-xs">Cerca</Label>
            <Input
              placeholder="Cerca per titolo..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
              }}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Stage</Label>
            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti gli stage</SelectItem>
                {PIPELINE_STAGES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Owner</Label>
            <Select value={ownerFilter} onValueChange={setOwnerFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti gli owner</SelectItem>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Valore min (EUR)</Label>
            <Input
              type="number"
              min="0"
              placeholder="0"
              value={minValue}
              onChange={(e) => {
                setMinValue(e.target.value);
              }}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Periodo</Label>
            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIOD_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="mt-2 text-right">
          <span className="text-muted-foreground text-sm">{filtered.length} deal</span>
        </div>
      </div>

      <DealTable
        deals={filtered}
        onEdit={handleEdit}
        onDelete={(id) => {
          setDeletingId(id);
        }}
      />

      <DealSheet
        open={sheetOpen}
        onOpenChange={handleSheetOpenChange}
        deal={editingDeal}
        companies={companies}
        contacts={contacts}
        users={users}
        onSuccess={() => {
          router.refresh();
        }}
      />

      <ConfirmDialog
        open={!!deletingId}
        onClose={() => {
          setDeletingId(null);
        }}
        title="Elimina Deal"
        description="Sei sicuro di voler eliminare questo deal? L'operazione non può essere annullata."
        onConfirm={handleDeleteConfirm}
        isLoading={isPending}
      />
    </div>
  );
}
