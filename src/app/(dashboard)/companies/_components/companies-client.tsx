"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { deleteCompany } from "../_lib/companies.actions";
import { CompanySheet } from "./company-sheet";
import { CompanyTable } from "./company-table";

import { ContactSheet } from "@/app/(dashboard)/contacts/_components/contact-sheet";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { usePermission } from "@/hooks/use-permission";
import { showPermissionDeniedToast } from "@/lib/rbac-toast";
import type { Company } from "@/server/db/schema";

type CompaniesClientProps = {
  companies: Company[];
  allTags: Array<{ id: string; name: string }>;
};

export function CompaniesClient({ companies, allTags }: CompaniesClientProps) {
  const router = useRouter();
  const canWrite = usePermission("delete:companies");
  const [query, setQuery] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [promptCompany, setPromptCompany] = useState<{ id: string; name: string } | null>(null);
  const [contactSheetOpen, setContactSheetOpen] = useState(false);
  const [contactDefaultCompanyId, setContactDefaultCompanyId] = useState<string | undefined>();

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

  const companiesForSelect = useMemo(() => {
    const list = companies.map((c) => ({ id: c.id, name: c.name }));
    if (promptCompany && !list.some((c) => c.id === promptCompany.id)) {
      list.push(promptCompany);
      list.sort((a, b) => a.name.localeCompare(b.name));
    }
    return list;
  }, [companies, promptCompany]);

  const handleEdit = (company: Company) => {
    if (!canWrite) {
      showPermissionDeniedToast();
      return;
    }
    setEditingCompany(company);
    setSheetOpen(true);
  };

  const handleViewDetail = (id: string) => {
    router.push(`/companies/${id}`);
  };

  const handleNewCompany = () => {
    if (!canWrite) {
      showPermissionDeniedToast();
      return;
    }
    setEditingCompany(null);
    setSheetOpen(true);
  };

  const handleSheetOpenChange = (open: boolean) => {
    setSheetOpen(open);
    if (!open) setEditingCompany(null);
  };

  const handleCompanySuccess = (created?: { id: string; name: string }) => {
    router.refresh();
    if (created) {
      setPromptCompany(created);
    }
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
          canWrite ? (
            <Button onClick={handleNewCompany}>
              <Plus className="mr-2 h-4 w-4" />
              Nuova Azienda
            </Button>
          ) : undefined
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
          if (!canWrite) {
            showPermissionDeniedToast();
            return;
          }
          setDeletingId(id);
        }}
        onViewDetail={handleViewDetail}
        canWrite={canWrite}
      />

      <CompanySheet
        open={sheetOpen}
        onOpenChange={handleSheetOpenChange}
        company={editingCompany}
        onSuccess={handleCompanySuccess}
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

      {/* Prompt: create contact after company creation */}
      <Dialog
        open={!!promptCompany}
        onOpenChange={(open) => {
          if (!open) setPromptCompany(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Contatto per {promptCompany?.name}</DialogTitle>
            <DialogDescription>Vuoi registrare un contatto per questa azienda?</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setPromptCompany(null);
              }}
            >
              No, grazie
            </Button>
            <Button
              onClick={() => {
                setContactDefaultCompanyId(promptCompany?.id);
                setContactSheetOpen(true);
                setPromptCompany(null);
              }}
            >
              Crea Contatto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ContactSheet
        open={contactSheetOpen}
        onOpenChange={setContactSheetOpen}
        companies={companiesForSelect}
        allTags={allTags}
        defaultCompanyId={contactDefaultCompanyId}
        onSuccess={() => {
          router.refresh();
        }}
      />
    </div>
  );
}
