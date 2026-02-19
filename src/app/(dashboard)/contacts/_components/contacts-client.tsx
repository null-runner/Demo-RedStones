"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { deleteContact } from "../_lib/contacts.actions";
import type { ContactWithCompany } from "../_lib/contacts.service";
import { ContactSheet } from "./contact-sheet";
import { ContactTable } from "./contact-table";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ContactsClientProps = {
  contacts: ContactWithCompany[];
  companies: Array<{ id: string; name: string }>;
};

export function ContactsClient({ contacts, companies }: ContactsClientProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<ContactWithCompany | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => {
      clearTimeout(timer);
    };
  }, [searchQuery]);

  const filtered = useMemo(() => {
    const q = debouncedQuery.toLowerCase();
    if (!q) return contacts;
    return contacts.filter(
      (c) =>
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
        (c.email?.toLowerCase().includes(q) ?? false) ||
        (c.companyName?.toLowerCase().includes(q) ?? false),
    );
  }, [contacts, debouncedQuery]);

  function handleNewContact() {
    setEditingContact(null);
    setSheetOpen(true);
  }

  function handleEdit(contact: ContactWithCompany) {
    setEditingContact(contact);
    setSheetOpen(true);
  }

  function handleDeleteClick(id: string) {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  }

  function handleDeleteConfirm() {
    if (!deletingId) return;
    startTransition(async () => {
      const result = await deleteContact(deletingId);
      if (result.success) {
        toast.success("Contatto eliminato");
        setDeleteDialogOpen(false);
        setDeletingId(null);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <>
      <PageHeader
        title="Contatti"
        description="Gestisci i tuoi contatti commerciali"
        action={<Button onClick={handleNewContact}>Nuovo Contatto</Button>}
      >
        <Input
          placeholder="Cerca per nome, email o azienda..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
          }}
          className="max-w-sm"
        />
      </PageHeader>

      <ContactTable contacts={filtered} onEdit={handleEdit} onDelete={handleDeleteClick} />

      <ContactSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        contact={editingContact}
        companies={companies}
        onSuccess={() => {
          router.refresh();
        }}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setDeletingId(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Elimina contatto"
        description="Sei sicuro di voler eliminare questo contatto?"
        confirmLabel="Elimina"
        isLoading={isPending}
      />
    </>
  );
}
