"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { createContact, updateContact } from "../_lib/contacts.actions";
import type { CreateContactInput } from "../_lib/contacts.schema";
import type { ContactWithCompanyAndTags } from "../_lib/contacts.service";
import { ContactForm } from "./contact-form";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type ContactSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact?: ContactWithCompanyAndTags | null;
  companies: Array<{ id: string; name: string }>;
  allTags: Array<{ id: string; name: string }>;
  onSuccess: () => void;
  defaultCompanyId?: string | undefined;
};

export function ContactSheet({
  open,
  onOpenChange,
  contact,
  companies,
  allTags,
  onSuccess,
  defaultCompanyId,
}: ContactSheetProps) {
  const [isPending, startTransition] = useTransition();

  const isEditing = contact != null;

  function handleSubmit(data: CreateContactInput) {
    startTransition(async () => {
      const result = isEditing
        ? await updateContact({ ...data, id: contact.id })
        : await createContact(data);

      if (result.success) {
        toast.success(isEditing ? "Contatto aggiornato" : "Contatto creato");
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{isEditing ? "Modifica Contatto" : "Nuovo Contatto"}</SheetTitle>
          <SheetDescription>
            {isEditing ? "Modifica i dati del contatto." : "Aggiungi un nuovo contatto al tuo CRM."}
          </SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-4">
          <ContactForm
            key={contact?.id ?? "new"}
            initialData={contact ?? null}
            companies={companies}
            allTags={allTags}
            onSubmit={handleSubmit}
            {...(defaultCompanyId != null ? { defaultCompanyId } : {})}
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
