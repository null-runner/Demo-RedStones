"use client";

import { CheckCircle2, ChevronRight } from "lucide-react";
import Link from "next/link";

import type { NbaSuggestion } from "@/app/(dashboard)/_lib/nba.service";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type NbaSuggestionsProps = {
  suggestions: NbaSuggestion[];
  emptyStateMessage?: string;
  onAction?: (suggestion: NbaSuggestion) => void;
};

function getPriorityBadge(priority: NbaSuggestion["priority"]) {
  if (priority === "high") return <Badge variant="destructive">Alta</Badge>;
  if (priority === "medium")
    return <Badge className="border-yellow-200 bg-yellow-100 text-yellow-800">Media</Badge>;
  return <Badge variant="outline">Bassa</Badge>;
}

function getEntityHref(suggestion: NbaSuggestion): string {
  if (suggestion.entityType === "deal") return `/deals/${suggestion.entityId}`;
  return `/contacts/${suggestion.entityId}`;
}

function SuggestionContent({ suggestion }: { suggestion: NbaSuggestion }) {
  return (
    <>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="font-medium">{suggestion.message}</span>
        <span className="text-muted-foreground truncate text-xs">{suggestion.entityTitle}</span>
      </div>
      <div className="flex flex-shrink-0 items-center gap-2">
        {getPriorityBadge(suggestion.priority)}
        <ChevronRight className="text-muted-foreground h-4 w-4" />
      </div>
    </>
  );
}

const CARD_CLASSES =
  "hover:bg-accent flex w-full items-center gap-3 rounded-md border p-3 text-left text-sm transition-colors";

export function NbaSuggestions({ suggestions, emptyStateMessage, onAction }: NbaSuggestionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Prossime Azioni Suggerite</CardTitle>
      </CardHeader>
      <CardContent>
        {suggestions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <CheckCircle2 className="mb-2 h-8 w-8 text-green-500" />
            <p className="text-muted-foreground text-sm">
              {emptyStateMessage ?? "Tutto in ordine — nessuna azione richiesta"}
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {suggestions.map((s) => (
              <li key={s.id}>
                {onAction ? (
                  <button
                    type="button"
                    className={CARD_CLASSES}
                    onClick={() => {
                      onAction(s);
                    }}
                  >
                    <SuggestionContent suggestion={s} />
                  </button>
                ) : (
                  <Link href={getEntityHref(s)} className={CARD_CLASSES}>
                    <SuggestionContent suggestion={s} />
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
