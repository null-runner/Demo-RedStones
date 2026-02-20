"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Building2, Edit, User } from "lucide-react";

import { DealSheet } from "./deal-sheet";
import { TimelineFeed } from "./timeline-feed";
import type { TimelineFeedRef } from "./timeline-feed";
import type { DealWithDetails } from "../_lib/deals.service";
import type { NbaSuggestion } from "../../_lib/nba.service";
import type { TimelineEntryWithAuthor } from "../_lib/timeline.service";

import { NbaSuggestions } from "@/app/(dashboard)/_components/nba-suggestions";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatEUR } from "@/lib/format";
import { isTerminalStage } from "@/lib/constants/pipeline";

type DealDetailProps = {
  deal: DealWithDetails;
  companies: Array<{ id: string; name: string }>;
  contacts: Array<{ id: string; firstName: string; lastName: string }>;
  users: Array<{ id: string; name: string }>;
  timelineEntries: TimelineEntryWithAuthor[];
  nbaSuggestions: NbaSuggestion[];
};

function getStageBadgeVariant(stage: string): "default" | "destructive" | "secondary" | "outline" {
  if (stage === "Chiuso Vinto") return "default";
  if (stage === "Chiuso Perso") return "destructive";
  return "secondary";
}

export function DealDetail({
  deal,
  companies,
  contacts,
  users,
  timelineEntries,
  nbaSuggestions,
}: DealDetailProps) {
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);
  const timelineRef = useRef<TimelineFeedRef>(null);

  const handleNbaAction = (suggestion: NbaSuggestion) => {
    if (suggestion.type === "add_notes") {
      timelineRef.current?.focusTextarea();
    } else if (suggestion.type === "follow_up") {
      timelineRef.current?.setNoteText("Follow-up: ");
      timelineRef.current?.focusTextarea();
    } else if (suggestion.type === "request_decision") {
      timelineRef.current?.setNoteText("Richiesta decisione: ");
      timelineRef.current?.focusTextarea();
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={deal.title}
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/deals">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Pipeline
              </Link>
            </Button>
            <Button
              onClick={() => {
                setSheetOpen(true);
              }}
            >
              <Edit className="mr-2 h-4 w-4" />
              Modifica
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Info Deal */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informazioni Deal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Stage</span>
              <Badge variant={getStageBadgeVariant(deal.stage)}>{deal.stage}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Valore</span>
              <span className="font-semibold">{formatEUR(parseFloat(deal.value))}</span>
            </div>
            {deal.contact && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1">
                  <User className="h-3.5 w-3.5" /> Contatto
                </span>
                <Link href={`/contacts/${deal.contact.id}`} className="font-medium hover:underline">
                  {deal.contact.firstName} {deal.contact.lastName}
                </Link>
              </div>
            )}
            {deal.company && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5" /> Azienda
                </span>
                <Link
                  href={`/companies/${deal.company.id}`}
                  className="font-medium hover:underline"
                >
                  {deal.company.name}
                </Link>
              </div>
            )}
            {deal.owner && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Owner</span>
                <span>{deal.owner.name ?? "—"}</span>
              </div>
            )}
            {deal.stage === "Chiuso Perso" && deal.lostReason && (
              <div className="border-t pt-2">
                <p className="text-muted-foreground mb-1 text-xs">Motivo perdita</p>
                <p className="text-destructive font-medium">{deal.lostReason}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* NBA Suggerimenti */}
        <NbaSuggestions
          suggestions={nbaSuggestions}
          onAction={handleNbaAction}
          {...(isTerminalStage(deal.stage) && { emptyStateMessage: "Deal concluso" })}
        />
      </div>

      {/* Timeline Attività */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Timeline Attività</CardTitle>
        </CardHeader>
        <CardContent>
          <TimelineFeed ref={timelineRef} dealId={deal.id} entries={timelineEntries} />
        </CardContent>
      </Card>

      <DealSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        deal={deal}
        companies={companies}
        contacts={contacts}
        users={users}
        onSuccess={() => {
          setSheetOpen(false);
          router.refresh();
        }}
      />
    </div>
  );
}
