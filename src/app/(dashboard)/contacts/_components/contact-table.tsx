"use client";

import { ArrowDown, ArrowUp, ArrowUpDown, Pencil, Trash2 } from "lucide-react";

import type { ContactWithCompanyAndTags } from "../_lib/contacts.service";

import { DataTable, type Column } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type SortKey = "firstName" | "email" | "companyName" | "role";
export type SortDirection = "asc" | "desc";

type ContactTableProps = {
  contacts: ContactWithCompanyAndTags[];
  onEdit: (contact: ContactWithCompanyAndTags) => void;
  onDelete: (id: string) => void;
  onViewDetail?: (id: string) => void;
  sortKey: SortKey;
  sortDirection: SortDirection;
  onSort: (key: SortKey) => void;
  canWrite?: boolean;
};

function SortableHeader({
  label,
  columnKey,
  activeSortKey,
  sortDirection,
  onSort,
}: {
  label: string;
  columnKey: SortKey;
  activeSortKey: SortKey;
  sortDirection: SortDirection;
  onSort: (key: SortKey) => void;
}) {
  const isActive = activeSortKey === columnKey;
  const Icon = isActive ? (sortDirection === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8"
      onClick={() => {
        onSort(columnKey);
      }}
    >
      {label}
      <Icon className="ml-1 h-3 w-3" />
    </Button>
  );
}

export function ContactTable({
  contacts,
  onEdit,
  onDelete,
  onViewDetail,
  sortKey,
  sortDirection,
  onSort,
  canWrite = true,
}: ContactTableProps) {
  const columns: Column<ContactWithCompanyAndTags>[] = [
    {
      key: "firstName",
      header: (
        <SortableHeader
          label="Nome"
          columnKey="firstName"
          activeSortKey={sortKey}
          sortDirection={sortDirection}
          onSort={onSort}
        />
      ),
      cell: (contact) =>
        onViewDetail ? (
          <button
            type="button"
            className="font-medium hover:underline"
            onClick={() => {
              onViewDetail(contact.id);
            }}
          >
            {contact.firstName} {contact.lastName}
          </button>
        ) : (
          `${contact.firstName} ${contact.lastName}`
        ),
    },
    {
      key: "email",
      header: (
        <SortableHeader
          label="Email"
          columnKey="email"
          activeSortKey={sortKey}
          sortDirection={sortDirection}
          onSort={onSort}
        />
      ),
      cell: (contact) => contact.email ?? "-",
    },
    {
      key: "companyName",
      header: (
        <SortableHeader
          label="Azienda"
          columnKey="companyName"
          activeSortKey={sortKey}
          sortDirection={sortDirection}
          onSort={onSort}
        />
      ),
      cell: (contact) => contact.companyName ?? "-",
    },
    {
      key: "role",
      header: (
        <SortableHeader
          label="Ruolo"
          columnKey="role"
          activeSortKey={sortKey}
          sortDirection={sortDirection}
          onSort={onSort}
        />
      ),
      cell: (contact) => contact.role ?? "-",
    },
    {
      key: "tags",
      header: "Tag",
      cell: (contact) => (
        <div className="flex flex-wrap gap-1">
          {contact.tags.slice(0, 2).map((t) => (
            <Badge key={t.id} variant="secondary">
              {t.name}
            </Badge>
          ))}
          {contact.tags.length > 2 && <Badge variant="outline">+{contact.tags.length - 2}</Badge>}
        </div>
      ),
    },
    {
      key: "id",
      header: "",
      cell: (contact) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Modifica"
            aria-disabled={!canWrite}
            className={canWrite ? undefined : "opacity-50"}
            onClick={() => {
              onEdit(contact);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Elimina"
            aria-disabled={!canWrite}
            className={canWrite ? undefined : "opacity-50"}
            onClick={() => {
              onDelete(contact.id);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return <DataTable columns={columns} data={contacts} keyExtractor={(c) => c.id} />;
}
