"use client";

import { useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { toast } from "sonner";

import { updateDeal } from "../_lib/deals.actions";
import { DealCard } from "./deal-card";

import { PIPELINE_STAGES } from "@/lib/constants/pipeline";
import type { PipelineStage } from "@/lib/constants/pipeline";
import { formatEUR } from "@/lib/format";
import type { Deal } from "@/server/db/schema";

type PipelineBoardProps = {
  deals: Deal[];
  contacts: Array<{ id: string; firstName: string; lastName: string }>;
  onLostReasonNeeded: (dealId: string, oldStage: PipelineStage) => void;
};

type KanbanColumn = {
  stage: PipelineStage;
  deals: Deal[];
  totalValue: number;
};

function buildColumns(deals: Deal[]): KanbanColumn[] {
  return PIPELINE_STAGES.map((stage) => {
    const stageDeals = deals.filter((d) => d.stage === stage);
    const totalValue = stageDeals.reduce((sum, d) => sum + parseFloat(d.value), 0);
    return { stage, deals: stageDeals, totalValue };
  });
}

function DroppableColumn({
  column,
  contacts,
}: {
  column: KanbanColumn;
  contacts: Array<{ id: string; firstName: string; lastName: string }>;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.stage });

  return (
    <div data-testid={`column-${column.stage}`} className="flex min-w-[220px] flex-1 flex-col">
      {/* Column header */}
      <div className="bg-muted/60 mb-3 flex items-center justify-between rounded-t-md px-3 py-2">
        <span className="text-sm font-semibold">{column.stage}</span>
        <div className="text-right">
          <span className="text-muted-foreground text-xs">{column.deals.length} deal</span>
          <p className="text-muted-foreground text-xs">{formatEUR(column.totalValue)}</p>
        </div>
      </div>
      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={`flex min-h-[200px] flex-col gap-2 rounded-b-md border p-2 transition-colors ${
          isOver ? "border-primary/50 bg-primary/5" : "border-border/50 bg-muted/20"
        }`}
      >
        <SortableContext
          items={column.deals.map((d) => d.id)}
          strategy={verticalListSortingStrategy}
        >
          {column.deals.map((deal) => {
            const contact = contacts.find((c) => c.id === deal.contactId);
            const contactName = contact ? `${contact.firstName} ${contact.lastName}` : undefined;
            return <DealCard key={deal.id} deal={deal} contactName={contactName} />;
          })}
        </SortableContext>
      </div>
    </div>
  );
}

export function PipelineBoard({ deals, contacts, onLostReasonNeeded }: PipelineBoardProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null);

  const [optimisticDeals, addOptimisticMove] = useOptimistic(
    deals,
    (state: Deal[], { dealId, newStage }: { dealId: string; newStage: PipelineStage }) =>
      state.map((d) => (d.id === dealId ? { ...d, stage: newStage } : d)),
  );

  const columns = buildColumns(optimisticDeals);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    const deal = deals.find((d) => d.id === event.active.id);
    setActiveDeal(deal ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDeal(null);
    const { active, over } = event;
    if (!over) return;

    const dealId = active.id as string;
    const currentDeal = deals.find((d) => d.id === dealId);
    if (!currentDeal) return;

    const targetStage: PipelineStage = PIPELINE_STAGES.includes(over.id as PipelineStage)
      ? (over.id as PipelineStage)
      : (deals.find((d) => d.id === over.id)?.stage ?? currentDeal.stage);

    if (currentDeal.stage === targetStage) return;

    // Intercept "Chiuso Perso" — require lost reason before moving
    if (targetStage === "Chiuso Perso") {
      onLostReasonNeeded(dealId, currentDeal.stage);
      return;
    }

    const oldStage = currentDeal.stage;

    startTransition(() => {
      addOptimisticMove({ dealId, newStage: targetStage });
    });

    startTransition(async () => {
      const result = await updateDeal({ id: dealId, stage: targetStage });

      if (!result.success) {
        toast.error(`Errore spostamento: ${result.error}`);
        router.refresh();
        return;
      }

      toast(`Deal spostato in ${targetStage}`, {
        duration: 5000,
        action: {
          label: "Annulla",
          onClick: () => {
            startTransition(async () => {
              const revertResult = await updateDeal({ id: dealId, stage: oldStage });
              if (!revertResult.success) {
                toast.error(`Errore annullamento: ${revertResult.error}`);
              } else {
                toast.success(`Deal tornato in ${oldStage}`);
              }
              router.refresh();
            });
          },
        },
      });

      router.refresh();
    });
  };

  const activeDealContact = activeDeal
    ? contacts.find((c) => c.id === activeDeal.contactId)
    : undefined;

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => (
          <DroppableColumn key={column.stage} column={column} contacts={contacts} />
        ))}
      </div>
      <DragOverlay>
        {activeDeal ? (
          <DealCard
            deal={activeDeal}
            contactName={
              activeDealContact
                ? `${activeDealContact.firstName} ${activeDealContact.lastName}`
                : undefined
            }
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
