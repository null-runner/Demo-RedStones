"use client";

import Link from "next/link";

import type { CompanyWithDetails } from "../../_lib/companies.service";

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

function EnrichmentFields({ company }: { company: CompanyWithDetails }) {
  return (
    <div className="space-y-2 text-sm">
      {company.enrichmentDescription && (
        <div>
          <span className="font-medium">Descrizione: </span>
          {company.enrichmentDescription}
        </div>
      )}
      {company.enrichmentSector && (
        <div>
          <span className="font-medium">Settore: </span>
          {company.enrichmentSector}
        </div>
      )}
      {company.enrichmentSize && (
        <div>
          <span className="font-medium">Dimensione: </span>
          {company.enrichmentSize}
        </div>
      )}
      {company.enrichmentPainPoints && (
        <div>
          <span className="font-medium">Pain Points: </span>
          {company.enrichmentPainPoints}
        </div>
      )}
    </div>
  );
}

function EnrichmentSection({ company }: { company: CompanyWithDetails }) {
  if (company.enrichmentStatus === "not_enriched") {
    return (
      <div className="bg-card rounded-lg border p-4">
        <h2 className="mb-3 text-base font-semibold">Dati Enrichment</h2>
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <p className="text-muted-foreground text-sm">
            Questa azienda non è ancora stata arricchita con dati AI.
          </p>
          <Button variant="outline" disabled>
            Arricchisci con AI
          </Button>
          <p className="text-muted-foreground text-xs">
            Funzionalità disponibile nella prossima versione
          </p>
        </div>
      </div>
    );
  }

  if (company.enrichmentStatus === "partial") {
    return (
      <div className="bg-card rounded-lg border p-4">
        <h2 className="mb-3 flex items-center gap-2 text-base font-semibold">
          Dati Enrichment
          <Badge variant="secondary">Parzialmente arricchita</Badge>
        </h2>
        <EnrichmentFields company={company} />
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border p-4">
      <h2 className="mb-3 text-base font-semibold">Dati Enrichment</h2>
      <EnrichmentFields company={company} />
    </div>
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
