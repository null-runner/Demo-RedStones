"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { createDeal, updateDeal } from "../_lib/deals.actions";
import { DealForm } from "./deal-form";
import type { DealFormSubmitData } from "./deal-form";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { Deal } from "@/server/db/schema";

type DealSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deal?: Deal | null;
  companies: Array<{ id: string; name: string }>;
  contacts: Array<{ id: string; firstName: string; lastName: string }>;
  users: Array<{ id: string; name: string }>;
  onSuccess: () => void;
};

export function DealSheet({
  open,
  onOpenChange,
  deal,
  companies,
  contacts,
  users,
  onSuccess,
}: DealSheetProps) {
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (data: DealFormSubmitData) => {
    startTransition(async () => {
      const result = deal
        ? await updateDeal({ ...data, id: deal.id, lostReason: data.lostReason ?? null })
        : await createDeal(data);
      if (!result.success) {
        toast.error(result.error);
      } else {
        toast.success(deal ? "Deal aggiornato" : "Deal creato");
        onOpenChange(false);
        onSuccess();
      }
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{deal ? "Modifica Deal" : "Nuovo Deal"}</SheetTitle>
          <SheetDescription>
            {deal ? "Aggiorna le informazioni del deal." : "Crea un nuovo deal nella pipeline."}
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6">
          <DealForm
            initialData={deal ?? null}
            companies={companies}
            contacts={contacts}
            users={users}
            onSubmit={handleSubmit}
            onCancel={() => {
              onOpenChange(false);
            }}
            isLoading={isPending}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
