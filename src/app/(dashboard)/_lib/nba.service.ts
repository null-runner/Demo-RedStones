import type { Contact, Deal, TimelineEntry } from "@/server/db/schema";
import { NBA_THRESHOLDS } from "@/lib/constants/nba";
import { isTerminalStage } from "@/lib/constants/pipeline";

export type NbaSuggestion = {
  id: string;
  type: "follow_up" | "request_decision" | "reactivate_contact" | "add_notes";
  message: string;
  entityType: "deal" | "contact";
  entityId: string;
  entityTitle: string;
  priority: "high" | "medium" | "low";
};

export type NbaResult = {
  suggestions: NbaSuggestion[];
  totalCount: number;
};

export type ContactWithLastActivity = Contact & {
  lastActivityDate: Date | null;
};

const PRIORITY_ORDER: Record<NbaSuggestion["priority"], number> = {
  high: 0,
  medium: 1,
  low: 2,
};

function getDaysAgo(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
}

export function getSuggestionsForDeal(
  deal: Deal,
  timelineEntries: TimelineEntry[],
): NbaSuggestion[] {
  if (isTerminalStage(deal.stage)) {
    return [];
  }

  const suggestions: NbaSuggestion[] = [];
  const daysInactive = getDaysAgo(deal.updatedAt);
  const hasNotes = timelineEntries.some((e) => e.type === "note");

  if (deal.stage === "Proposta" && daysInactive > NBA_THRESHOLDS.DECISION_DAYS) {
    suggestions.push({
      id: `${deal.id}-request_decision`,
      type: "request_decision",
      message: `Richiedi decisione — in Proposta da ${String(daysInactive)} giorni`,
      entityType: "deal",
      entityId: deal.id,
      entityTitle: deal.title,
      priority: "high",
    });
  } else if (daysInactive > NBA_THRESHOLDS.FOLLOW_UP_DAYS) {
    suggestions.push({
      id: `${deal.id}-follow_up`,
      type: "follow_up",
      message: `Invia follow-up — fermo da ${String(daysInactive)} giorni`,
      entityType: "deal",
      entityId: deal.id,
      entityTitle: deal.title,
      priority: "medium",
    });
  }

  if (!hasNotes) {
    suggestions.push({
      id: `${deal.id}-add_notes`,
      type: "add_notes",
      message: "Aggiungi note — nessuna nota su questo deal",
      entityType: "deal",
      entityId: deal.id,
      entityTitle: deal.title,
      priority: "low",
    });
  }

  return suggestions;
}

export function getSuggestionsForContact(
  contact: Contact,
  lastActivityDate: Date | null,
): NbaSuggestion[] {
  const refDate = lastActivityDate ?? contact.createdAt;
  const daysInactive = getDaysAgo(refDate);

  if (daysInactive > NBA_THRESHOLDS.REACTIVATE_DAYS) {
    return [
      {
        id: `${contact.id}-reactivate_contact`,
        type: "reactivate_contact",
        message: `Riattiva contatto — inattivo da ${String(daysInactive)} giorni`,
        entityType: "contact",
        entityId: contact.id,
        entityTitle: `${contact.firstName} ${contact.lastName}`,
        priority: "high",
      },
    ];
  }

  return [];
}

export function getAllSuggestions(
  dealList: Deal[],
  contactList: ContactWithLastActivity[],
  timelineEntriesByDealId: Map<string, TimelineEntry[]>,
): NbaResult {
  const allSuggestions: NbaSuggestion[] = [];

  for (const deal of dealList) {
    const entries = timelineEntriesByDealId.get(deal.id) ?? [];
    allSuggestions.push(...getSuggestionsForDeal(deal, entries));
  }

  for (const contact of contactList) {
    allSuggestions.push(...getSuggestionsForContact(contact, contact.lastActivityDate));
  }

  allSuggestions.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);

  return { suggestions: allSuggestions, totalCount: allSuggestions.length };
}
