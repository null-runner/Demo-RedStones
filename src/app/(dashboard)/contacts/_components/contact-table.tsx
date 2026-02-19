"use client";

import { ArrowDown, ArrowUp, ArrowUpDown, Pencil, Trash2 } from "lucide-react";

import type { ContactWithCompany } from "../_lib/contacts.service";

import { DataTable, type Column } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";

export type SortKey = "firstName" | "email" | "companyName" | "role";
export type SortDirection = "asc" | "desc";

type ContactTableProps = {
  contacts: ContactWithCompany[];
  onEdit: (contact: ContactWithCompany) => void;
  onDelete: (id: string) => void;
  sortKey: SortKey;
  sortDirection: SortDirection;
  onSort: (key: SortKey) => void;
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
  sortKey,
  sortDirection,
  onSort,
}: ContactTableProps) {
  const columns: Column<ContactWithCompany>[] = [
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
      cell: (contact) => `${contact.firstName} ${contact.lastName}`,
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
      key: "id",
      header: "",
      cell: (contact) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Modifica"
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
