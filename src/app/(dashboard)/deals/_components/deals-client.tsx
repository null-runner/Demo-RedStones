"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LayoutGrid, List, Plus } from "lucide-react";
import { toast } from "sonner";

import { deleteDeal, updateDeal } from "../_lib/deals.actions";
import { DealSheet } from "./deal-sheet";
import { DealTable } from "./deal-table";
import { LostReasonDialog } from "./lost-reason-dialog";
import { PipelineBoard } from "./pipeline-board";

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
import type { PipelineStage } from "@/lib/constants/pipeline";
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
  stages: string[];
};

export function DealsClient({ deals, companies, contacts, users, stages }: DealsClientProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [ownerFilter, setOwnerFilter] = useState<string>("all");
  const [minValue, setMinValue] = useState("");
  const [maxValue, setMaxValue] = useState("");
  const [periodFilter, setPeriodFilter] = useState<string>("all");
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingLostDeal, setPendingLostDeal] = useState<{
    id: string;
    title: string;
    oldStage: PipelineStage;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const now = new Date();
    return deals.filter((deal) => {
      if (query.trim() && !deal.title.toLowerCase().includes(query.toLowerCase())) return false;
      if (stageFilter !== "all" && deal.stage !== stageFilter) return false;
      if (ownerFilter !== "all" && deal.ownerId !== ownerFilter) return false;
      const numVal = parseFloat(deal.value);
      if (minValue !== "" && numVal < parseFloat(minValue)) return false;
      if (maxValue !== "" && numVal > parseFloat(maxValue)) return false;
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
  }, [deals, query, stageFilter, ownerFilter, minValue, maxValue, periodFilter]);

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

  const handleLostReasonNeeded = (dealId: string, oldStage: PipelineStage) => {
    const deal = deals.find((d) => d.id === dealId);
    if (!deal) return;
    setPendingLostDeal({ id: dealId, title: deal.title, oldStage });
  };

  const handleLostReasonConfirm = (reason: string, notes: string | null) => {
    if (!pendingLostDeal) return;
    const { id } = pendingLostDeal;
    setPendingLostDeal(null);
    startTransition(async () => {
      const lostReasonValue = notes ? `${reason}: ${notes}` : reason;
      const result = await updateDeal({ id, stage: "Chiuso Perso", lostReason: lostReasonValue });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Deal spostato in Chiuso Perso");
      router.refresh();
    });
  };

  const handleLostReasonCancel = () => {
    setPendingLostDeal(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pipeline"
        description="Gestisci le opportunità commerciali"
        action={
          <div className="flex items-center gap-2">
            <div className="flex rounded-md border">
              <Button
                variant={view === "kanban" ? "secondary" : "ghost"}
                size="sm"
                className="rounded-r-none"
                onClick={() => {
                  setView("kanban");
                  setStageFilter("all");
                }}
                aria-label="Vista kanban"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={view === "list" ? "secondary" : "ghost"}
                size="sm"
                className="rounded-l-none"
                onClick={() => {
                  setView("list");
                }}
                aria-label="Vista lista"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            <Button onClick={handleNewDeal}>
              <Plus className="mr-2 h-4 w-4" />
              Nuovo Deal
            </Button>
          </div>
        }
      />

      {/* Filtri */}
      <div className="bg-muted/50 rounded-lg border p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
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
          {view === "list" && (
            <div className="space-y-1">
              <Label className="text-xs">Stage</Label>
              <Select value={stageFilter} onValueChange={setStageFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti gli stage</SelectItem>
                  {stages.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
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
            <Label className="text-xs">Valore max (EUR)</Label>
            <Input
              type="number"
              min="0"
              placeholder="∞"
              value={maxValue}
              onChange={(e) => {
                setMaxValue(e.target.value);
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

      {view === "kanban" ? (
        <PipelineBoard
          deals={filtered}
          contacts={contacts}
          onLostReasonNeeded={handleLostReasonNeeded}
          stages={stages}
        />
      ) : (
        <DealTable
          deals={filtered}
          onEdit={handleEdit}
          onDelete={(id) => {
            setDeletingId(id);
          }}
        />
      )}

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

      <LostReasonDialog
        open={!!pendingLostDeal}
        dealTitle={pendingLostDeal?.title ?? ""}
        onConfirm={handleLostReasonConfirm}
        onCancel={handleLostReasonCancel}
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
