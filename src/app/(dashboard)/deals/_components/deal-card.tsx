"use client";

import { memo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Building2, ShieldX, Trash2 } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatEUR } from "@/lib/format";
import type { Deal } from "@/server/db/schema";

type DealCardProps = {
  deal: Deal;
  contactName?: string | undefined;
  companyName?: string | undefined;
  onDelete?: ((id: string) => void) | undefined;
};

export const DealCardContent = memo(function DealCardContent({
  deal,
  contactName,
  companyName,
  onDelete,
}: DealCardProps) {
  return (
    <Card className="group relative cursor-grab border shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing">
      <CardContent className="p-3">
        {onDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 absolute top-1.5 right-1.5 h-5 w-5 transition-colors"
            aria-label={`Elimina ${deal.title}`}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(deal.id);
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
        <div className={onDelete ? "pr-5" : ""}>
          <p className="text-sm leading-snug font-medium">{deal.title}</p>
          <p className="text-muted-foreground mt-1 text-xs">{formatEUR(parseFloat(deal.value))}</p>
          {companyName && (
            <p className="text-muted-foreground mt-0.5 flex items-center gap-1 text-xs">
              <Building2 className="h-3 w-3 flex-shrink-0" />
              <span className="leading-snug">{companyName}</span>
            </p>
          )}
          {contactName && (
            <p className="text-muted-foreground mt-0.5 text-xs leading-snug">{contactName}</p>
          )}
          {deal.stage === "Chiuso Perso" && deal.lostReason && (
            <p className="text-destructive/70 mt-1 flex items-center gap-1 text-xs">
              <ShieldX className="h-3 w-3 flex-shrink-0" />
              <span className="leading-snug">{deal.lostReason}</span>
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

export function DealCard({ deal, contactName, companyName, onDelete }: DealCardProps) {
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
      <DealCardContent
        deal={deal}
        contactName={contactName}
        companyName={companyName}
        onDelete={onDelete}
      />
    </div>
  );
}
