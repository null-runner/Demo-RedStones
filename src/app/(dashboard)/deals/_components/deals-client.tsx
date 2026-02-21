"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Info, LayoutGrid, List, Plus } from "lucide-react";
import { toast } from "sonner";

import { deleteDeal, updateDeal } from "../_lib/deals.actions";
import { DealSheet } from "./deal-sheet";
import { DealTable } from "./deal-table";
import { LostReasonDialog } from "./lost-reason-dialog";
import { PipelineBoard } from "./pipeline-board";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DateRangePicker } from "@/components/shared/date-range-picker";
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
import { useDateRange } from "@/hooks/use-date-range";
import { usePermission } from "@/hooks/use-permission";
import { toCents } from "@/lib/format";
import { showPermissionDeniedToast } from "@/lib/rbac-toast";
import type { Deal } from "@/server/db/schema";

type DealsClientProps = {
  deals: Deal[];
  companies: Array<{ id: string; name: string }>;
  contacts: Array<{ id: string; firstName: string; lastName: string }>;
  users: Array<{ id: string; name: string }>;
  stages: string[];
  initialDateRange: { from: string; to: string };
};

export function DealsClient({
  deals,
  companies,
  contacts,
  users,
  stages,
  initialDateRange,
}: DealsClientProps) {
  const router = useRouter();
  const canWrite = usePermission("delete:deals");
  const [query, setQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [ownerFilter, setOwnerFilter] = useState<string>("all");
  const [minValue, setMinValue] = useState("");
  const [maxValue, setMaxValue] = useState("");
  const [dateRange, setDateRange] = useDateRange({
    from: new Date(initialDateRange.from),
    to: new Date(initialDateRange.to),
  });
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingLostDeal, setPendingLostDeal] = useState<{
    id: string;
    title: string;
    oldStage: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    return deals.filter((deal) => {
      if (query.trim()) {
        const q = query.toLowerCase();
        const companyName = companies.find((c) => c.id === deal.companyId)?.name ?? "";
        const ownerName = users.find((u) => u.id === deal.ownerId)?.name ?? "";
        const matchesTitle = deal.title.toLowerCase().includes(q);
        const matchesCompany = companyName.toLowerCase().includes(q);
        const matchesOwner = ownerName.toLowerCase().includes(q);
        if (!matchesTitle && !matchesCompany && !matchesOwner) return false;
      }
      if (stageFilter !== "all" && deal.stage !== stageFilter) return false;
      if (ownerFilter !== "all" && deal.ownerId !== ownerFilter) return false;
      const dealCents = toCents(deal.value);
      if (minValue !== "" && dealCents < toCents(minValue)) return false;
      if (maxValue !== "" && dealCents > toCents(maxValue)) return false;
      if (deal.createdAt < dateRange.from || deal.createdAt > dateRange.to) return false;
      return true;
    });
  }, [deals, query, stageFilter, ownerFilter, minValue, maxValue, dateRange, companies, users]);

  const handleEdit = (deal: Deal) => {
    if (!canWrite) {
      showPermissionDeniedToast();
      return;
    }
    setEditingDeal(deal);
    setSheetOpen(true);
  };

  const handleNewDeal = () => {
    if (!canWrite) {
      showPermissionDeniedToast();
      return;
    }
    setEditingDeal(null);
    setSheetOpen(true);
  };

  const handleSheetOpenChange = (open: boolean) => {
    setSheetOpen(open);
    if (!open) setEditingDeal(null);
  };

  const handleDeleteClick = (id: string) => {
    if (!canWrite) {
      showPermissionDeniedToast();
      return;
    }
    setDeletingId(id);
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

  const handleLostReasonNeeded = (dealId: string, oldStage: string) => {
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
    <div className={view === "kanban" ? "flex min-h-0 flex-1 flex-col" : "space-y-6"}>
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
            {canWrite && (
              <Button onClick={handleNewDeal}>
                <Plus className="mr-2 h-4 w-4" />
                Nuovo Deal
              </Button>
            )}
          </div>
        }
      />

      {/* Filtri */}
      <div className="bg-muted/50 mt-6 flex-shrink-0 rounded-lg border p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <div className="space-y-1">
            <Label className="flex items-center gap-1 text-xs">
              Cerca
              <span title="Cerca per titolo deal, azienda o owner">
                <Info className="text-muted-foreground h-3.5 w-3.5" />
              </span>
            </Label>
            <Input
              placeholder="Titolo, azienda, owner..."
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
            <DateRangePicker value={dateRange} onChange={setDateRange} />
          </div>
        </div>
        <div className="mt-2 text-right">
          <span className="text-muted-foreground text-sm">{filtered.length} deal</span>
        </div>
      </div>

      {view === "kanban" ? (
        <div className="mt-4 flex min-h-0 flex-1 flex-col">
          <PipelineBoard
            deals={filtered}
            contacts={contacts}
            companies={companies}
            onLostReasonNeeded={handleLostReasonNeeded}
            stages={stages}
          />
        </div>
      ) : (
        <DealTable
          deals={filtered}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
          canWrite={canWrite}
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
