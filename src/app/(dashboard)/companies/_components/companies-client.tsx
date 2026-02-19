"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { deleteCompany } from "../_lib/companies.actions";
import { CompanySheet } from "./company-sheet";
import { CompanyTable } from "./company-table";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Company } from "@/server/db/schema";

type CompaniesClientProps = {
  companies: Company[];
};

export function CompaniesClient({ companies }: CompaniesClientProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    if (!query.trim()) return companies;
    const q = query.toLowerCase();
    return companies.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.domain?.toLowerCase().includes(q) ?? false) ||
        (c.sector?.toLowerCase().includes(q) ?? false),
    );
  }, [companies, query]);

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    setSheetOpen(true);
  };

  const handleNewCompany = () => {
    setEditingCompany(null);
    setSheetOpen(true);
  };

  const handleSheetOpenChange = (open: boolean) => {
    setSheetOpen(open);
    if (!open) setEditingCompany(null);
  };

  const handleDeleteConfirm = () => {
    if (!deletingId) return;
    startTransition(async () => {
      const result = await deleteCompany(deletingId);
      if (!result.success) {
        toast.error(result.error);
      } else {
        toast.success("Azienda eliminata");
        router.refresh();
      }
      setDeletingId(null);
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Aziende"
        description="Gestisci le aziende nel tuo CRM"
        action={
          <Button onClick={handleNewCompany}>
            <Plus className="mr-2 h-4 w-4" />
            Nuova Azienda
          </Button>
        }
      />

      <div className="flex items-center gap-2">
        <Input
          placeholder="Cerca per nome, dominio, settore..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
          }}
          className="max-w-sm"
        />
        <span className="text-muted-foreground text-sm">{filtered.length} aziende</span>
      </div>

      <CompanyTable
        companies={filtered}
        onEdit={handleEdit}
        onDelete={(id) => {
          setDeletingId(id);
        }}
      />

      <CompanySheet
        open={sheetOpen}
        onOpenChange={handleSheetOpenChange}
        company={editingCompany}
        onSuccess={() => {
          router.refresh();
        }}
      />

      <ConfirmDialog
        open={!!deletingId}
        onClose={() => {
          setDeletingId(null);
        }}
        title="Elimina Azienda"
        description="Sei sicuro di voler eliminare questa azienda? L'operazione non può essere annullata."
        onConfirm={handleDeleteConfirm}
        isLoading={isPending}
      />
    </div>
  );
}
