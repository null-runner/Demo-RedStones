"use client";

import Link from "next/link";
import { format } from "date-fns";

import type { ContactWithDetails } from "../../_lib/contacts.service";

import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type ContactDetailProps = {
  contact: ContactWithDetails;
};

function formatCurrency(value: string): string {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(
    parseFloat(value),
  );
}

function formatRelativeDate(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "oggi";
  if (diffDays === 1) return "ieri";
  if (diffDays < 7) return `${String(diffDays)} giorni fa`;
  return format(date, "dd MMM yyyy");
}

export function ContactDetail({ contact }: ContactDetailProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        title={`${contact.firstName} ${contact.lastName}`}
        action={
          <div className="flex gap-2">
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
        {contact.tags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {contact.tags.map((tag) => (
              <Badge key={tag.id} variant="secondary">
                {tag.name}
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
              <div
                key={deal.id}
                className="flex items-center justify-between rounded-md border p-3 text-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium">{deal.title}</span>
                  <Badge variant="outline">{deal.stage}</Badge>
                </div>
                <span className="text-muted-foreground">{formatCurrency(deal.value)}</span>
              </div>
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
                <span className="text-muted-foreground flex-shrink-0">
                  {formatRelativeDate(entry.createdAt)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">Nessuna attività registrata</p>
        )}
      </div>
    </div>
  );
}
