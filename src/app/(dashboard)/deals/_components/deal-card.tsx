"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { formatEUR } from "@/lib/format";
import type { Deal } from "@/server/db/schema";

type DealCardProps = {
  deal: Deal;
  contactName?: string | undefined;
  onEdit: (deal: Deal) => void;
};

export function DealCard({ deal, contactName, onEdit }: DealCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: deal.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card
        className="cursor-pointer border shadow-sm transition-shadow hover:shadow-md"
        onClick={() => {
          onEdit(deal);
        }}
      >
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <button
              className="text-muted-foreground hover:text-foreground mt-0.5 cursor-grab"
              {...attributes}
              {...listeners}
              aria-label="Trascina"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <GripVertical className="h-4 w-4" />
            </button>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{deal.title}</p>
              <p className="text-muted-foreground mt-1 text-xs">
                {formatEUR(parseFloat(deal.value))}
              </p>
              {contactName && (
                <p className="text-muted-foreground mt-0.5 truncate text-xs">{contactName}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
