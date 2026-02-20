"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { createCompany, updateCompany } from "../_lib/companies.actions";
import type { CreateCompanyInput } from "../_lib/companies.schema";
import { CompanyForm } from "./company-form";

import type { Company } from "@/server/db/schema";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type CompanySheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company?: Company | null;
  onSuccess: () => void;
};

export function CompanySheet({ open, onOpenChange, company, onSuccess }: CompanySheetProps) {
  const [isPending, startTransition] = useTransition();
  const isEdit = !!company;

  const handleSubmit = (data: CreateCompanyInput) => {
    startTransition(async () => {
      const result = isEdit
        ? await updateCompany({ ...data, id: company.id })
        : await createCompany(data);

      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(isEdit ? "Azienda aggiornata" : "Azienda creata");
      onOpenChange(false);
      onSuccess();
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Modifica Azienda" : "Nuova Azienda"}</SheetTitle>
          <SheetDescription>
            {isEdit ? "Modifica i dati dell'azienda." : "Aggiungi una nuova azienda al tuo CRM."}
          </SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-4">
          <CompanyForm
            key={company?.id ?? "new"}
            initialData={company ?? null}
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
