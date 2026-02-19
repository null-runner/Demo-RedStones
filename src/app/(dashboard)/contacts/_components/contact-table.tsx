"use client";

import { Pencil, Trash2, Users } from "lucide-react";

import type { ContactWithCompany } from "../_lib/contacts.service";

import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";

type ContactTableProps = {
  contacts: ContactWithCompany[];
  onEdit: (contact: ContactWithCompany) => void;
  onDelete: (id: string) => void;
};

export function ContactTable({ contacts, onEdit, onDelete }: ContactTableProps) {
  if (contacts.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Nessun contatto"
        description="Aggiungi il tuo primo contatto per iniziare."
      />
    );
  }

  const columns: Column<ContactWithCompany>[] = [
    {
      key: "firstName",
      header: "Nome",
      cell: (contact) => `${contact.firstName} ${contact.lastName}`,
    },
    {
      key: "email",
      header: "Email",
      cell: (contact) => contact.email ?? "-",
    },
    {
      key: "companyName",
      header: "Azienda",
      cell: (contact) => contact.companyName ?? "-",
    },
    {
      key: "role",
      header: "Ruolo",
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
