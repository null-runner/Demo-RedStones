"use client";

import { memo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Building2 } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { Card, CardContent } from "@/components/ui/card";
import { formatEUR } from "@/lib/format";
import type { Deal } from "@/server/db/schema";

type DealCardProps = {
  deal: Deal;
  contactName?: string | undefined;
  companyName?: string | undefined;
};

export const DealCardContent = memo(function DealCardContent({
  deal,
  contactName,
  companyName,
}: DealCardProps) {
  return (
    <Card className="cursor-grab border shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing">
      <CardContent className="p-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{deal.title}</p>
          <p className="text-muted-foreground mt-1 text-xs">{formatEUR(parseFloat(deal.value))}</p>
          {companyName && (
            <p className="text-muted-foreground mt-0.5 flex items-center gap-1 truncate text-xs">
              <Building2 className="h-3 w-3 flex-shrink-0" />
              {companyName}
            </p>
          )}
          {contactName && (
            <p className="text-muted-foreground mt-0.5 truncate text-xs">{contactName}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

export function DealCard({ deal, contactName, companyName }: DealCardProps) {
  const router = useRouter();
  const pointerWasDragging = useRef(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: deal.id,
  });

  useEffect(() => {
    if (isDragging) {
      pointerWasDragging.current = true;
    }
  }, [isDragging]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => {
        if (pointerWasDragging.current) {
          pointerWasDragging.current = false;
          return;
        }
        router.push(`/deals/${deal.id}`);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          router.push(`/deals/${deal.id}`);
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Apri deal ${deal.title}`}
    >
      <DealCardContent deal={deal} contactName={contactName} companyName={companyName} />
    </div>
  );
}
