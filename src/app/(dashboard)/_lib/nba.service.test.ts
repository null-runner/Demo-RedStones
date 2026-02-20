import { describe, expect, it } from "vitest";

import { getAllSuggestions, getSuggestionsForContact, getSuggestionsForDeal } from "./nba.service";

import type { Contact, Deal, TimelineEntry } from "@/server/db/schema";

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function makeDeal(overrides: Partial<Deal> = {}): Deal {
  return {
    id: "deal-id-1",
    title: "Test Deal",
    value: "1000",
    stage: "Demo",
    contactId: null,
    companyId: null,
    ownerId: null,
    lostReason: null,
    createdAt: daysAgo(30),
    updatedAt: daysAgo(1),
    ...overrides,
  };
}

function makeContact(overrides: Partial<Contact> = {}): Contact {
  return {
    id: "contact-id-1",
    firstName: "Mario",
    lastName: "Rossi",
    email: "mario@test.it",
    phone: null,
    role: null,
    companyId: null,
    createdAt: daysAgo(60),
    updatedAt: daysAgo(60),
    ...overrides,
  };
}

function makeTimelineEntry(overrides: Partial<TimelineEntry> = {}): TimelineEntry {
  return {
    id: "entry-id-1",
    dealId: "deal-id-1",
    type: "note",
    content: "Nota di test",
    previousStage: null,
    newStage: null,
    authorId: null,
    createdAt: daysAgo(5),
    ...overrides,
  };
}

describe("getSuggestionsForDeal", () => {
  it("AC2: deal fermo 8 giorni in stage non-terminale → follow_up", () => {
    const deal = makeDeal({ updatedAt: daysAgo(8) });
    const suggestions = getSuggestionsForDeal(deal, []);
    const types = suggestions.map((s) => s.type);
    expect(types).toContain("follow_up");
  });

  it("deal fermo 6 giorni → nessun follow_up", () => {
    const deal = makeDeal({ updatedAt: daysAgo(6) });
    const suggestions = getSuggestionsForDeal(deal, []);
    const types = suggestions.map((s) => s.type);
    expect(types).not.toContain("follow_up");
  });

  it("AC3: deal stage Proposta, updatedAt 15 giorni fa → request_decision (non follow_up)", () => {
    const deal = makeDeal({ stage: "Proposta", updatedAt: daysAgo(15) });
    const suggestions = getSuggestionsForDeal(deal, []);
    const types = suggestions.map((s) => s.type);
    expect(types).toContain("request_decision");
    expect(types).not.toContain("follow_up");
  });

  it("deal stage Proposta, updatedAt 13 giorni fa → follow_up (non request_decision)", () => {
    const deal = makeDeal({ stage: "Proposta", updatedAt: daysAgo(13) });
    const suggestions = getSuggestionsForDeal(deal, []);
    const types = suggestions.map((s) => s.type);
    expect(types).toContain("follow_up");
    expect(types).not.toContain("request_decision");
  });

  it("AC4: deal Proposta fermo 15 giorni → UN SOLO suggerimento, tipo request_decision", () => {
    const deal = makeDeal({ stage: "Proposta", updatedAt: daysAgo(15) });
    const suggestions = getSuggestionsForDeal(deal, []);
    const nonNotes = suggestions.filter((s) => s.type !== "add_notes");
    expect(nonNotes).toHaveLength(1);
    expect(nonNotes[0]?.type).toBe("request_decision");
  });

  it("AC5a: deal stage Chiuso Vinto → array vuoto", () => {
    const deal = makeDeal({ stage: "Chiuso Vinto", updatedAt: daysAgo(20) });
    expect(getSuggestionsForDeal(deal, [])).toHaveLength(0);
  });

  it("AC5b: deal stage Chiuso Perso → array vuoto", () => {
    const deal = makeDeal({ stage: "Chiuso Perso", updatedAt: daysAgo(20) });
    expect(getSuggestionsForDeal(deal, [])).toHaveLength(0);
  });

  it("AC6a: deal senza note nella timeline → add_notes", () => {
    const deal = makeDeal({ updatedAt: daysAgo(1) });
    const entries = [makeTimelineEntry({ type: "stage_change" })];
    const suggestions = getSuggestionsForDeal(deal, entries);
    const types = suggestions.map((s) => s.type);
    expect(types).toContain("add_notes");
  });

  it("AC6b: deal con almeno una timeline entry type note → nessun add_notes", () => {
    const deal = makeDeal({ updatedAt: daysAgo(1) });
    const entries = [makeTimelineEntry({ type: "note" })];
    const suggestions = getSuggestionsForDeal(deal, entries);
    const types = suggestions.map((s) => s.type);
    expect(types).not.toContain("add_notes");
  });

  it("AC13: request_decision ha priority high", () => {
    const deal = makeDeal({ stage: "Proposta", updatedAt: daysAgo(15) });
    const suggestions = getSuggestionsForDeal(deal, []);
    const rdSuggestion = suggestions.find((s) => s.type === "request_decision");
    expect(rdSuggestion?.priority).toBe("high");
  });

  it("AC13: follow_up ha priority medium", () => {
    const deal = makeDeal({ updatedAt: daysAgo(8) });
    const suggestions = getSuggestionsForDeal(deal, [makeTimelineEntry({ type: "note" })]);
    const fuSuggestion = suggestions.find((s) => s.type === "follow_up");
    expect(fuSuggestion?.priority).toBe("medium");
  });

  it("AC13: add_notes ha priority low", () => {
    const deal = makeDeal({ updatedAt: daysAgo(1) });
    const suggestions = getSuggestionsForDeal(deal, []);
    const anSuggestion = suggestions.find((s) => s.type === "add_notes");
    expect(anSuggestion?.priority).toBe("low");
  });

  it("follow_up message contiene i giorni", () => {
    const deal = makeDeal({ updatedAt: daysAgo(8) });
    const suggestions = getSuggestionsForDeal(deal, [makeTimelineEntry({ type: "note" })]);
    const fuSuggestion = suggestions.find((s) => s.type === "follow_up");
    expect(fuSuggestion?.message).toMatch(/fermo da \d+ giorni/);
  });

  it("request_decision message contiene i giorni", () => {
    const deal = makeDeal({ stage: "Proposta", updatedAt: daysAgo(15) });
    const suggestions = getSuggestionsForDeal(deal, [makeTimelineEntry({ type: "note" })]);
    const rdSuggestion = suggestions.find((s) => s.type === "request_decision");
    expect(rdSuggestion?.message).toMatch(/in Proposta da \d+ giorni/);
  });
});

describe("getSuggestionsForContact", () => {
  it("AC7: contatto inattivo 31 giorni → reactivate_contact", () => {
    const contact = makeContact();
    const suggestions = getSuggestionsForContact(contact, daysAgo(31));
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0]?.type).toBe("reactivate_contact");
  });

  it("contatto inattivo 29 giorni → nessun suggerimento", () => {
    const contact = makeContact();
    const suggestions = getSuggestionsForContact(contact, daysAgo(29));
    expect(suggestions).toHaveLength(0);
  });

  it("AC9: lastActivityDate null → usa contact.createdAt, createdAt 31 giorni fa → reactivate_contact", () => {
    const contact = makeContact({ createdAt: daysAgo(31) });
    const suggestions = getSuggestionsForContact(contact, null);
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0]?.type).toBe("reactivate_contact");
  });

  it("AC8: contatto attivo negli ultimi 30 giorni → array vuoto", () => {
    const contact = makeContact();
    const suggestions = getSuggestionsForContact(contact, daysAgo(10));
    expect(suggestions).toHaveLength(0);
  });

  it("AC13: reactivate_contact ha priority high", () => {
    const contact = makeContact();
    const suggestions = getSuggestionsForContact(contact, daysAgo(31));
    expect(suggestions[0]?.priority).toBe("high");
  });

  it("reactivate_contact message contiene i giorni", () => {
    const contact = makeContact();
    const suggestions = getSuggestionsForContact(contact, daysAgo(31));
    expect(suggestions[0]?.message).toMatch(/inattivo da \d+ giorni/);
  });
});

describe("getAllSuggestions", () => {
  it("AC10: con un deal e un contatto → oggetto con suggestions e totalCount", () => {
    const deal = makeDeal({ updatedAt: daysAgo(8) });
    const contact = makeContact({ createdAt: daysAgo(31) });
    const entriesMap = new Map<string, TimelineEntry[]>();
    const result = getAllSuggestions([deal], [{ ...contact, lastActivityDate: null }], entriesMap);
    expect(result).toHaveProperty("suggestions");
    expect(result).toHaveProperty("totalCount");
    expect(result.totalCount).toBe(result.suggestions.length);
  });

  it("AC11: con zero deal e zero contatti → { suggestions: [], totalCount: 0 }", () => {
    const result = getAllSuggestions([], [], new Map());
    expect(result).toEqual({ suggestions: [], totalCount: 0 });
  });

  it("AC14: getAllSuggestions ordina high → medium → low", () => {
    const dealWithFollowUp = makeDeal({ id: "deal-1", updatedAt: daysAgo(8) });
    const dealWithRequestDecision = makeDeal({
      id: "deal-2",
      stage: "Proposta",
      updatedAt: daysAgo(15),
    });
    const contact = makeContact({ id: "contact-1", createdAt: daysAgo(31) });
    const entriesMap = new Map<string, TimelineEntry[]>();
    entriesMap.set("deal-1", [makeTimelineEntry({ type: "note", dealId: "deal-1" })]);
    entriesMap.set("deal-2", [makeTimelineEntry({ type: "note", dealId: "deal-2" })]);
    const result = getAllSuggestions(
      [dealWithFollowUp, dealWithRequestDecision],
      [{ ...contact, lastActivityDate: null }],
      entriesMap,
    );
    const priorities = result.suggestions.map((s) => s.priority);
    const highIdx = priorities.indexOf("high");
    const medIdx = priorities.indexOf("medium");
    const lowIdx = priorities.lastIndexOf("low");
    expect(highIdx).toBeLessThan(medIdx === -1 ? Infinity : medIdx);
    if (medIdx !== -1 && lowIdx !== -1) {
      expect(medIdx).toBeLessThan(lowIdx);
    }
  });
});
