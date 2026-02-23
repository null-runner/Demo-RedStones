"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  closestCorners,
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { toast } from "sonner";

import { deleteDeal, updateDeal } from "../_lib/deals.actions";
import { DealCard, DealCardContent } from "./deal-card";
import { LostReasonDialog } from "./lost-reason-dialog";

import { useBoardSync } from "@/hooks/use-board-sync";
import { formatEUR, sumCurrency } from "@/lib/format";
import { DEALS_CHANNEL } from "@/lib/pusher-events";
import type { Deal } from "@/server/db/schema";

type PipelineBoardProps = {
  deals: Deal[];
  contacts: Array<{ id: string; firstName: string; lastName: string; companyId: string | null }>;
  companies: Array<{ id: string; name: string }>;
  stages: string[];
  onManualReorder?: () => void;
};

type KanbanColumn = {
  stage: string;
  deals: Deal[];
  totalValue: number;
};

function buildColumns(deals: Deal[], stages: string[]): KanbanColumn[] {
  return stages.map((stage) => {
    const stageDeals = deals.filter((d) => d.stage === stage);
    const totalValue = sumCurrency(stageDeals.map((d) => d.value));
    return { stage, deals: stageDeals, totalValue };
  });
}

function DroppableColumn({
  column,
  contactMap,
  companyMap,
  onDelete,
}: {
  column: KanbanColumn;
  contactMap: Map<string, { firstName: string; lastName: string }>;
  companyMap: Map<string, string>;
  onDelete: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.stage });

  return (
    <div data-testid={`column-${column.stage}`} className="flex min-w-[250px] flex-1 flex-col">
      {/* Column header */}
      <div className="bg-muted/60 flex flex-shrink-0 items-center justify-between rounded-t-md px-3 py-2">
        <span className="text-sm font-semibold">{column.stage}</span>
        <div className="text-right">
          <span className="text-muted-foreground text-xs">{column.deals.length} deal</span>
          <p className="text-muted-foreground text-xs">{formatEUR(column.totalValue)}</p>
        </div>
      </div>
      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={`flex flex-1 flex-col gap-2 overflow-y-auto rounded-b-md border p-2 transition-colors ${
          isOver ? "border-primary/50 bg-primary/5" : "border-border/50 bg-muted/20"
        }`}
      >
        <SortableContext
          items={column.deals.map((d) => d.id)}
          strategy={verticalListSortingStrategy}
        >
          {column.deals.map((deal) => {
            const contact = deal.contactId ? contactMap.get(deal.contactId) : undefined;
            const contactName = contact ? `${contact.firstName} ${contact.lastName}` : undefined;
            const companyName = deal.companyId ? companyMap.get(deal.companyId) : undefined;
            return (
              <DealCard
                key={deal.id}
                deal={deal}
                contactName={contactName}
                companyName={companyName}
                onDelete={onDelete}
              />
            );
          })}
        </SortableContext>
      </div>
    </div>
  );
}

export function PipelineBoard({
  deals,
  contacts,
  companies,
  stages,
  onManualReorder,
}: PipelineBoardProps) {
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null);
  const [localDeals, setLocalDeals] = useState(deals);
  const [pendingLostDeal, setPendingLostDeal] = useState<{
    id: string;
    title: string;
    oldStage: string;
  } | null>(null);
  const pendingMoves = useRef(0);

  // Sync local state from props when no optimistic moves are in-flight
  useEffect(() => {
    if (pendingMoves.current === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: conditional prop-derived state
      setLocalDeals(deals);
    }
  }, [deals]);

  // Real-time sync: merge remote changes from Pusher
  useBoardSync(DEALS_CHANNEL, (event) => {
    if (pendingMoves.current > 0) return;

    setLocalDeals((prev) => {
      switch (event.type) {
        case "deal:updated":
          return prev.map((d) => (d.id === event.deal.id ? event.deal : d));
        case "deal:created":
          if (prev.some((d) => d.id === event.deal.id)) return prev;
          return [...prev, event.deal];
        case "deal:deleted":
          return prev.filter((d) => d.id !== event.dealId);
      }
    });
  });

  const contactMap = useMemo(
    () => new Map(contacts.map((c) => [c.id, { firstName: c.firstName, lastName: c.lastName }])),
    [contacts],
  );
  const companyMap = useMemo(() => new Map(companies.map((c) => [c.id, c.name])), [companies]);

  const columns = buildColumns(localDeals, stages);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    const deal = localDeals.find((d) => d.id === event.active.id);
    setActiveDeal(deal ?? null);
  };

  const moveDeal = (dealId: string, newStage: string) => {
    setLocalDeals((prev) => prev.map((d) => (d.id === dealId ? { ...d, stage: newStage } : d)));
  };

  const moveDealToPosition = (dealId: string, newStage: string, overId: string) => {
    setLocalDeals((prev) => {
      const deal = prev.find((d) => d.id === dealId);
      if (!deal) return prev;
      const movedDeal = { ...deal, stage: newStage };
      const without = prev.filter((d) => d.id !== dealId);
      // If dropped on the column itself, append at end
      if (stages.includes(overId)) return [...without, movedDeal];
      // Insert at the position of the target deal
      const overIndex = without.findIndex((d) => d.id === overId);
      if (overIndex === -1) return [...without, movedDeal];
      const result = [...without];
      result.splice(overIndex, 0, movedDeal);
      return result;
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDeal(null);
    const { active, over } = event;
    if (!over) return;

    const dealId = active.id as string;
    const currentDeal = localDeals.find((d) => d.id === dealId);
    if (!currentDeal) return;

    const targetStage: string = stages.includes(over.id as string)
      ? (over.id as string)
      : (localDeals.find((d) => d.id === over.id)?.stage ?? currentDeal.stage);

    if (currentDeal.stage === targetStage) {
      const overId = over.id as string;
      const columnDeals = localDeals.filter((d) => d.stage === targetStage);
      const oldIndex = columnDeals.findIndex((d) => d.id === dealId);
      const newIndex = columnDeals.findIndex((d) => d.id === overId);
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

      const reordered = arrayMove(columnDeals, oldIndex, newIndex);
      setLocalDeals((prev) => {
        const others = prev.filter((d) => d.stage !== targetStage);
        return [...others, ...reordered];
      });
      onManualReorder?.();
      return;
    }

    const oldStage = currentDeal.stage;

    if (targetStage === "Chiuso Perso") {
      moveDealToPosition(dealId, targetStage, over.id as string);
      pendingMoves.current += 1;
      setPendingLostDeal({ id: dealId, title: currentDeal.title, oldStage });
      return;
    }

    moveDealToPosition(dealId, targetStage, over.id as string);
    pendingMoves.current += 1;

    void updateDeal({ id: dealId, stage: targetStage })
      .then((result) => {
        if (!result.success) {
          moveDeal(dealId, oldStage);
          toast.error(`Errore spostamento: ${result.error}`);
          return;
        }

        toast(`Deal spostato in ${targetStage}`, {
          duration: 5000,
          action: {
            label: "Annulla",
            onClick: () => {
              moveDeal(dealId, oldStage);
              pendingMoves.current += 1;
              void updateDeal({ id: dealId, stage: oldStage })
                .then((revertResult) => {
                  if (!revertResult.success) {
                    moveDeal(dealId, targetStage);
                    toast.error(`Errore annullamento: ${revertResult.error}`);
                  } else {
                    toast.success(`Deal tornato in ${oldStage}`);
                  }
                })
                .finally(() => {
                  pendingMoves.current -= 1;
                });
            },
          },
        });
      })
      .finally(() => {
        pendingMoves.current -= 1;
      });
  };

  const handleDelete = (dealId: string) => {
    setLocalDeals((prev) => prev.filter((d) => d.id !== dealId));
    void deleteDeal(dealId).then((result) => {
      if (!result.success) {
        setLocalDeals(deals);
        toast.error(result.error);
      } else {
        toast.success("Deal eliminato");
      }
    });
  };

  const handleLostReasonConfirm = (reason: string, notes: string | null) => {
    if (!pendingLostDeal) return;
    const { id, oldStage } = pendingLostDeal;
    const lostReasonValue = notes ? `${reason}: ${notes}` : reason;
    setPendingLostDeal(null);

    void updateDeal({ id, stage: "Chiuso Perso", lostReason: lostReasonValue })
      .then((result) => {
        if (!result.success) {
          moveDeal(id, oldStage);
          toast.error(`Errore: ${result.error}`);
          return;
        }
        toast.success("Deal spostato in Chiuso Perso");
      })
      .finally(() => {
        pendingMoves.current -= 1;
      });
  };

  const handleLostReasonCancel = () => {
    if (!pendingLostDeal) return;
    moveDeal(pendingLostDeal.id, pendingLostDeal.oldStage);
    pendingMoves.current -= 1;
    setPendingLostDeal(null);
  };

  const activeDealContact = activeDeal?.contactId
    ? contactMap.get(activeDeal.contactId)
    : undefined;
  const activeDealCompany = activeDeal?.companyId
    ? companyMap.get(activeDeal.companyId)
    : undefined;

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex min-h-0 flex-1 gap-4 overflow-x-auto">
          {columns.map((column) => (
            <DroppableColumn
              key={column.stage}
              column={column}
              contactMap={contactMap}
              companyMap={companyMap}
              onDelete={handleDelete}
            />
          ))}
        </div>
        <DragOverlay
          dropAnimation={{
            duration: 200,
            easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
          }}
        >
          {activeDeal ? (
            <div className="scale-[1.03] rotate-[2deg] cursor-grabbing shadow-xl [will-change:transform]">
              <DealCardContent
                deal={activeDeal}
                contactName={
                  activeDealContact
                    ? `${activeDealContact.firstName} ${activeDealContact.lastName}`
                    : undefined
                }
                companyName={activeDealCompany}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
      <LostReasonDialog
        open={!!pendingLostDeal}
        dealTitle={pendingLostDeal?.title ?? ""}
        onConfirm={handleLostReasonConfirm}
        onCancel={handleLostReasonCancel}
      />
    </>
  );
}
