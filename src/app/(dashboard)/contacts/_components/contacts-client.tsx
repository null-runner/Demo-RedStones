"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Users } from "lucide-react";
import { toast } from "sonner";

import { deleteContact } from "../_lib/contacts.actions";
import type { ContactWithCompany } from "../_lib/contacts.service";
import { ContactSheet } from "./contact-sheet";
import { ContactTable, type SortDirection, type SortKey } from "./contact-table";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ITEMS_PER_PAGE = 10;

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
  const [sortKey, setSortKey] = useState<SortKey>("firstName");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setCurrentPage(1);
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

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aVal = getSortValue(a, sortKey);
      const bVal = getSortValue(b, sortKey);
      const cmp = aVal.localeCompare(bVal, "it");
      return sortDirection === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / ITEMS_PER_PAGE));
  const paginated = sorted.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

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

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  }

  if (contacts.length === 0) {
    return (
      <>
        <PageHeader title="Contatti" description="Gestisci i tuoi contatti commerciali" />
        <EmptyState
          icon={Users}
          title="Nessun contatto"
          description="Aggiungi il tuo primo contatto per iniziare."
          action={{ label: "Nuovo Contatto", onClick: handleNewContact }}
        />
        <ContactSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          contact={editingContact}
          companies={companies}
          onSuccess={() => {
            router.refresh();
          }}
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Contatti"
        description="Gestisci i tuoi contatti commerciali"
        action={<Button onClick={handleNewContact}>Nuovo Contatto</Button>}
      >
        <Input
          type="search"
          aria-label="Cerca contatti"
          placeholder="Cerca per nome, email o azienda..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
          }}
          className="max-w-sm"
        />
      </PageHeader>

      <ContactTable
        contacts={paginated}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        sortKey={sortKey}
        sortDirection={sortDirection}
        onSort={handleSort}
      />

      {sorted.length > ITEMS_PER_PAGE && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            {(currentPage - 1) * ITEMS_PER_PAGE + 1}&ndash;
            {Math.min(currentPage * ITEMS_PER_PAGE, sorted.length)} di {sorted.length} contatti
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setCurrentPage((p) => p - 1);
              }}
              disabled={currentPage === 1}
            >
              Precedente
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setCurrentPage((p) => p + 1);
              }}
              disabled={currentPage === totalPages}
            >
              Successivo
            </Button>
          </div>
        </div>
      )}

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

function getSortValue(contact: ContactWithCompany, key: SortKey): string {
  switch (key) {
    case "firstName":
      return `${contact.firstName} ${contact.lastName}`.toLowerCase();
    case "email":
      return (contact.email ?? "").toLowerCase();
    case "companyName":
      return (contact.companyName ?? "").toLowerCase();
    case "role":
      return (contact.role ?? "").toLowerCase();
  }
}
