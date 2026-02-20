"use client";

import Link from "next/link";

import type { CompanyWithDetails } from "../../_lib/companies.service";
import { EnrichmentSection } from "./enrichment-section";

import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type CompanyDetailProps = {
  company: CompanyWithDetails;
};

function formatCurrency(value: string): string {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(
    parseFloat(value),
  );
}

export function CompanyDetail({ company }: CompanyDetailProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        title={company.name}
        action={
          <Button variant="outline" asChild>
            <Link href="/companies">← Torna alle Aziende</Link>
          </Button>
        }
      />

      {/* Informazioni Aziendali */}
      <div className="bg-card rounded-lg border p-4">
        <h2 className="mb-3 text-base font-semibold">Informazioni Aziendali</h2>
        <div className="space-y-2 text-sm">
          <div>
            <span className="font-medium">Nome: </span>
            {company.name}
          </div>
          {company.domain && (
            <div>
              <span className="font-medium">Dominio: </span>
              <a
                href={`https://${company.domain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                {company.domain}
              </a>
            </div>
          )}
          {company.sector && (
            <div>
              <span className="font-medium">Settore: </span>
              {company.sector}
            </div>
          )}
          {company.description && (
            <div>
              <span className="font-medium">Descrizione: </span>
              {company.description}
            </div>
          )}
        </div>
      </div>

      {/* Sezione Enrichment */}
      <EnrichmentSection company={company} />

      {/* Contatti Collegati */}
      <div className="bg-card rounded-lg border p-4">
        <h2 className="mb-3 text-base font-semibold">
          Contatti Collegati ({company.contacts.length})
        </h2>
        {company.contacts.length > 0 ? (
          <div className="space-y-2">
            {company.contacts.map((contact) => (
              <div
                key={contact.id}
                className="flex items-center justify-between rounded-md border p-3 text-sm"
              >
                <div>
                  <Link href={`/contacts/${contact.id}`} className="font-medium hover:underline">
                    {contact.firstName} {contact.lastName}
                  </Link>
                  {contact.role && (
                    <span className="text-muted-foreground ml-2">{contact.role}</span>
                  )}
                </div>
                {contact.email && (
                  <span className="text-muted-foreground text-xs">{contact.email}</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">Nessun contatto collegato</p>
        )}
      </div>

      {/* Deal Associati */}
      <div className="bg-card rounded-lg border p-4">
        <h2 className="mb-3 text-base font-semibold">Deal Associati ({company.deals.length})</h2>
        {company.deals.length > 0 ? (
          <div className="space-y-2">
            {company.deals.map((deal) => (
              <div
                key={deal.id}
                className="flex items-center justify-between rounded-md border p-3 text-sm"
              >
                <div className="flex items-center gap-3">
                  <Link href={`/deals/${deal.id}`} className="font-medium hover:underline">
                    {deal.title}
                  </Link>
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
    </div>
  );
}
