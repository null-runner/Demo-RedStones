"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { toast } from "sonner";

import type { ContactWithDetails } from "../../_lib/contacts.service";
import { syncContactTags } from "../../_lib/contacts.actions";
import { ContactSheet } from "../../_components/contact-sheet";
import { TagInput } from "../../_components/tag-input";

import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePermission } from "@/hooks/use-permission";
import { formatEUR, formatRelativeDate } from "@/lib/format";

type ContactDetailProps = {
  contact: ContactWithDetails;
  companies: Array<{ id: string; name: string }>;
  allTags: Array<{ id: string; name: string }>;
};

export function ContactDetail({ contact, companies, allTags }: ContactDetailProps) {
  const router = useRouter();
  const canWrite = usePermission("update:contacts");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [localTagNames, setLocalTagNames] = useState(() => contact.tags.map((t) => t.name));
  const lastGoodTags = useRef(localTagNames);
  const [isTagSyncing, startTagTransition] = useTransition();

  const syncTags = (next: string[]) => {
    setLocalTagNames(next);
    startTagTransition(async () => {
      const result = await syncContactTags(contact.id, next);
      if (!result.success) {
        toast.error(result.error);
        setLocalTagNames(lastGoodTags.current);
      } else {
        lastGoodTags.current = next;
        router.refresh();
      }
    });
  };

  const handleTagAdd = (tagName: string) => {
    syncTags([...localTagNames, tagName]);
  };

  const handleTagRemove = (tagName: string) => {
    syncTags(localTagNames.filter((n) => n !== tagName));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${contact.firstName} ${contact.lastName}`}
        action={
          <div className="flex gap-2">
            {canWrite && (
              <Button
                variant="outline"
                onClick={() => {
                  setSheetOpen(true);
                }}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Modifica
              </Button>
            )}
            <Button variant="outline" asChild>
              <Link href="/contacts">← Torna ai Contatti</Link>
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Informazioni Personali */}
        <div className="bg-card rounded-lg border p-4">
          <h2 className="mb-3 text-base font-semibold">Informazioni Personali</h2>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium">Nome: </span>
              {contact.firstName}
            </div>
            <div>
              <span className="font-medium">Cognome: </span>
              {contact.lastName}
            </div>
            {contact.email && (
              <div>
                <span className="font-medium">Email: </span>
                <a href={`mailto:${contact.email}`} className="hover:underline">
                  {contact.email}
                </a>
              </div>
            )}
            {contact.phone && (
              <div>
                <span className="font-medium">Telefono: </span>
                <span>{contact.phone}</span>
              </div>
            )}
            {contact.role && (
              <div>
                <span className="font-medium">Ruolo: </span>
                <span>{contact.role}</span>
              </div>
            )}
          </div>
        </div>

        {/* Azienda */}
        <div className="bg-card rounded-lg border p-4">
          <h2 className="mb-3 text-base font-semibold">Azienda</h2>
          <div className="text-sm">
            {contact.companyName ? (
              <div className="space-y-1">
                <div>
                  <span className="font-medium">Nome: </span>
                  {contact.companyId ? (
                    <Link href={`/companies/${contact.companyId}`} className="hover:underline">
                      {contact.companyName}
                    </Link>
                  ) : (
                    contact.companyName
                  )}
                </div>
                {contact.companyDomain && (
                  <div>
                    <span className="font-medium">Dominio: </span>
                    {contact.companyDomain}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">Nessuna azienda associata</p>
            )}
          </div>
        </div>
      </div>

      {/* Tag */}
      <div className="bg-card rounded-lg border p-4">
        <h2 className="mb-3 text-base font-semibold">Tag</h2>
        {canWrite ? (
          <TagInput
            value={localTagNames}
            allTags={allTags}
            onAdd={handleTagAdd}
            onRemove={handleTagRemove}
            disabled={isTagSyncing}
          />
        ) : localTagNames.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {localTagNames.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">Nessun tag</p>
        )}
      </div>

      {/* Deal Associati */}
      <div className="bg-card rounded-lg border p-4">
        <h2 className="mb-3 text-base font-semibold">Deal Associati</h2>
        {contact.deals.length > 0 ? (
          <div className="space-y-3">
            {contact.deals.map((deal) => (
              <Link
                key={deal.id}
                href={`/deals/${deal.id}`}
                className="hover:bg-accent flex items-center justify-between rounded-md border p-3 text-sm transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium">{deal.title}</span>
                  <Badge variant="outline">{deal.stage}</Badge>
                </div>
                <span className="text-muted-foreground">{formatEUR(parseFloat(deal.value))}</span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">Nessun deal associato</p>
        )}
      </div>

      {/* Attività Recenti */}
      <div className="bg-card rounded-lg border p-4">
        <h2 className="mb-3 text-base font-semibold">Attività Recenti</h2>
        {contact.recentActivity.length > 0 ? (
          <div className="space-y-3">
            {contact.recentActivity.map((entry) => (
              <div key={entry.id} className="flex items-start gap-3 text-sm">
                <div className="flex-1">
                  {entry.type === "note" && entry.content ? (
                    <p>{entry.content}</p>
                  ) : (
                    <p className="text-muted-foreground">
                      Stage cambiato a{" "}
                      <span className="text-foreground font-medium">{entry.newStage}</span>
                    </p>
                  )}
                </div>
                <span className="text-muted-foreground flex-shrink-0" suppressHydrationWarning>
                  {formatRelativeDate(entry.createdAt)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">Nessuna attività registrata</p>
        )}
      </div>

      <ContactSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        contact={contact}
        companies={companies}
        allTags={allTags}
        onSuccess={() => {
          router.refresh();
        }}
      />
    </div>
  );
}
