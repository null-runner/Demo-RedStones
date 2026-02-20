"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Users } from "lucide-react";
import { toast } from "sonner";

import { deleteContact } from "../_lib/contacts.actions";
import type { ContactWithCompanyAndTags } from "../_lib/contacts.service";
import { ContactSheet } from "./contact-sheet";
import { ContactTable, type SortDirection, type SortKey } from "./contact-table";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePermission } from "@/hooks/use-permission";
import { showPermissionDeniedToast } from "@/lib/rbac-toast";

const ITEMS_PER_PAGE = 10;
const ALL_FILTER = "__all__";

type ContactsClientProps = {
  contacts: ContactWithCompanyAndTags[];
  companies: Array<{ id: string; name: string }>;
  allTags: Array<{ id: string; name: string }>;
};

export function ContactsClient({ contacts, companies, allTags }: ContactsClientProps) {
  const router = useRouter();
  const canWrite = usePermission("delete:contacts");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<ContactWithCompanyAndTags | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [sortKey, setSortKey] = useState<SortKey>("firstName");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [filterCompanyId, setFilterCompanyId] = useState<string>("");
  const [filterTagName, setFilterTagName] = useState<string>("");
  const [filterRole, setFilterRole] = useState<string>("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => {
      clearTimeout(timer);
    };
  }, [searchQuery]);

  const roles = useMemo(
    () => [...new Set(contacts.map((c) => c.role).filter((r): r is string => r != null))].sort(),
    [contacts],
  );

  const filtered = useMemo(() => {
    const q = debouncedQuery.toLowerCase();
    return contacts.filter((c) => {
      const matchSearch =
        !q ||
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
        (c.email?.toLowerCase().includes(q) ?? false) ||
        (c.companyName?.toLowerCase().includes(q) ?? false);
      const matchCompany = !filterCompanyId || c.companyId === filterCompanyId;
      const matchTag = !filterTagName || c.tags.some((t) => t.name === filterTagName);
      const matchRole = !filterRole || c.role === filterRole;
      return matchSearch && matchCompany && matchTag && matchRole;
    });
  }, [contacts, debouncedQuery, filterCompanyId, filterTagName, filterRole]);

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
    if (!canWrite) {
      showPermissionDeniedToast();
      return;
    }
    setEditingContact(null);
    setSheetOpen(true);
  }

  function handleEdit(contact: ContactWithCompanyAndTags) {
    if (!canWrite) {
      showPermissionDeniedToast();
      return;
    }
    setEditingContact(contact);
    setSheetOpen(true);
  }

  function handleDeleteClick(id: string) {
    if (!canWrite) {
      showPermissionDeniedToast();
      return;
    }
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
          {...(canWrite && { action: { label: "Nuovo Contatto", onClick: handleNewContact } })}
        />
        <ContactSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          contact={editingContact}
          companies={companies}
          allTags={allTags}
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
        action={canWrite ? <Button onClick={handleNewContact}>Nuovo Contatto</Button> : undefined}
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
        <div className="mt-2 flex flex-wrap gap-2">
          <Select
            value={filterCompanyId || ALL_FILTER}
            onValueChange={(val) => {
              setFilterCompanyId(val === ALL_FILTER ? "" : val);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtra per azienda" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_FILTER}>Tutte le aziende</SelectItem>
              {companies.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filterTagName || ALL_FILTER}
            onValueChange={(val) => {
              setFilterTagName(val === ALL_FILTER ? "" : val);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Filtra per tag" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_FILTER}>Tutti i tag</SelectItem>
              {allTags.map((t) => (
                <SelectItem key={t.id} value={t.name}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filterRole || ALL_FILTER}
            onValueChange={(val) => {
              setFilterRole(val === ALL_FILTER ? "" : val);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Filtra per ruolo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_FILTER}>Tutti i ruoli</SelectItem>
              {roles.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </PageHeader>

      <ContactTable
        contacts={paginated}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        onViewDetail={(id) => {
          router.push(`/contacts/${id}`);
        }}
        sortKey={sortKey}
        sortDirection={sortDirection}
        onSort={handleSort}
        canWrite={canWrite}
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
        allTags={allTags}
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

function getSortValue(contact: ContactWithCompanyAndTags, key: SortKey): string {
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
