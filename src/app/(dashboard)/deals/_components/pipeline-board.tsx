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
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { toast } from "sonner";

import { updateDeal } from "../_lib/deals.actions";
import { DealCard, DealCardContent } from "./deal-card";

import { formatEUR, sumCurrency } from "@/lib/format";
import type { Deal } from "@/server/db/schema";

type PipelineBoardProps = {
  deals: Deal[];
  contacts: Array<{ id: string; firstName: string; lastName: string }>;
  companies: Array<{ id: string; name: string }>;
  onLostReasonNeeded: (dealId: string, oldStage: string) => void;
  stages: string[];
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
}: {
  column: KanbanColumn;
  contactMap: Map<string, { firstName: string; lastName: string }>;
  companyMap: Map<string, string>;
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
  onLostReasonNeeded,
  stages,
}: PipelineBoardProps) {
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null);
  const [localDeals, setLocalDeals] = useState(deals);
  const pendingMoves = useRef(0);

  // Sync local state from props when no optimistic moves are in-flight
  useEffect(() => {
    if (pendingMoves.current === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: conditional prop-derived state
      setLocalDeals(deals);
    }
  }, [deals]);

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

    if (currentDeal.stage === targetStage) return;

    if (targetStage === "Chiuso Perso") {
      onLostReasonNeeded(dealId, currentDeal.stage);
      return;
    }

    const oldStage = currentDeal.stage;

    moveDeal(dealId, targetStage);
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

  const activeDealContact = activeDeal?.contactId
    ? contactMap.get(activeDeal.contactId)
    : undefined;
  const activeDealCompany = activeDeal?.companyId
    ? companyMap.get(activeDeal.companyId)
    : undefined;

  return (
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
  );
}
