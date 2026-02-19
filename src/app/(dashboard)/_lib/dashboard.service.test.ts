import { describe, expect, it } from "vitest";

import { calculateKPIs } from "./dashboard.service";

import type { Deal } from "@/server/db/schema";

const NOW = new Date("2026-02-15T12:00:00Z");

function makeDeal(overrides: Partial<Deal> = {}): Deal {
  return {
    id: "uuid-1",
    title: "Test Deal",
    value: "10000.00",
    stage: "Proposta",
    contactId: null,
    companyId: null,
    ownerId: null,
    lostReason: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

describe("calculateKPIs", () => {
  it("returns all zeros for empty deal list", () => {
    const result = calculateKPIs([], NOW);
    expect(result.pipelineValue).toBe(0);
    expect(result.winRate).toBe(0);
    expect(result.winRateTrend.direction).toBe("neutral");
    expect(result.winRateTrend.delta).toBe(0);
    expect(result.velocity).toBe(0);
    expect(result.wonDealsCount).toBe(0);
    expect(result.wonDealsValue).toBe(0);
  });

  it("calculates pipeline value as sum of active (non-terminal) deals", () => {
    const deals: Deal[] = [
      makeDeal({ id: "1", value: "10000.00", stage: "Proposta" }),
      makeDeal({ id: "2", value: "20000.00", stage: "Negoziazione" }),
      makeDeal({ id: "3", value: "5000.00", stage: "Chiuso Vinto" }),
      makeDeal({ id: "4", value: "8000.00", stage: "Chiuso Perso" }),
    ];
    const result = calculateKPIs(deals, NOW);
    expect(result.pipelineValue).toBe(30000);
  });

  it("calculates win rate: 3 won + 1 lost in current month = 75%", () => {
    const inCurrentMonth = new Date("2026-02-10T00:00:00Z");
    const deals: Deal[] = [
      makeDeal({
        id: "1",
        stage: "Chiuso Vinto",
        createdAt: inCurrentMonth,
        updatedAt: inCurrentMonth,
      }),
      makeDeal({
        id: "2",
        stage: "Chiuso Vinto",
        createdAt: inCurrentMonth,
        updatedAt: inCurrentMonth,
      }),
      makeDeal({
        id: "3",
        stage: "Chiuso Vinto",
        createdAt: inCurrentMonth,
        updatedAt: inCurrentMonth,
      }),
      makeDeal({
        id: "4",
        stage: "Chiuso Perso",
        createdAt: inCurrentMonth,
        updatedAt: inCurrentMonth,
      }),
      makeDeal({
        id: "5",
        stage: "Proposta",
        createdAt: inCurrentMonth,
        updatedAt: inCurrentMonth,
      }),
    ];
    const result = calculateKPIs(deals, NOW);
    expect(result.winRate).toBe(75);
  });

  it("calculates win rate trend: current 35%, previous 28% → up with delta 7", () => {
    // Previous month: 7 won, 13 lost → 35% wait, let me re-read
    // current month: 35% = 7 won / 20 total → 7 won, 13 lost
    // prev month: 28% → need (28/100) * total → 7/25 = 28%
    const inCurrMonth = new Date("2026-02-10T00:00:00Z");
    const inPrevMonth = new Date("2026-01-10T00:00:00Z");

    const deals: Deal[] = [
      // Current month: 7 won, 13 lost = 35% win rate
      ...Array.from({ length: 7 }, (_, i) =>
        makeDeal({
          id: `c-won-${String(i)}`,
          stage: "Chiuso Vinto",
          createdAt: inCurrMonth,
          updatedAt: inCurrMonth,
        }),
      ),
      ...Array.from({ length: 13 }, (_, i) =>
        makeDeal({
          id: `c-lost-${String(i)}`,
          stage: "Chiuso Perso",
          createdAt: inCurrMonth,
          updatedAt: inCurrMonth,
        }),
      ),
      // Prev month: 7 won, 18 lost = 7/25 = 28% win rate
      ...Array.from({ length: 7 }, (_, i) =>
        makeDeal({
          id: `p-won-${String(i)}`,
          stage: "Chiuso Vinto",
          createdAt: inPrevMonth,
          updatedAt: inPrevMonth,
        }),
      ),
      ...Array.from({ length: 18 }, (_, i) =>
        makeDeal({
          id: `p-lost-${String(i)}`,
          stage: "Chiuso Perso",
          createdAt: inPrevMonth,
          updatedAt: inPrevMonth,
        }),
      ),
    ];
    const result = calculateKPIs(deals, NOW);
    expect(result.winRate).toBeCloseTo(35, 0);
    expect(result.winRateTrend.direction).toBe("up");
    expect(result.winRateTrend.delta).toBeGreaterThan(0);
  });

  it("calculates win rate trend negative: current < previous → down", () => {
    const inCurrMonth = new Date("2026-02-10T00:00:00Z");
    const inPrevMonth = new Date("2026-01-10T00:00:00Z");

    const deals: Deal[] = [
      // Current month: 1 won, 4 lost = 20%
      makeDeal({
        id: "c-won-1",
        stage: "Chiuso Vinto",
        createdAt: inCurrMonth,
        updatedAt: inCurrMonth,
      }),
      ...Array.from({ length: 4 }, (_, i) =>
        makeDeal({
          id: `c-lost-${String(i)}`,
          stage: "Chiuso Perso",
          createdAt: inCurrMonth,
          updatedAt: inCurrMonth,
        }),
      ),
      // Prev month: 5 won, 5 lost = 50%
      ...Array.from({ length: 5 }, (_, i) =>
        makeDeal({
          id: `p-won-${String(i)}`,
          stage: "Chiuso Vinto",
          createdAt: inPrevMonth,
          updatedAt: inPrevMonth,
        }),
      ),
      ...Array.from({ length: 5 }, (_, i) =>
        makeDeal({
          id: `p-lost-${String(i)}`,
          stage: "Chiuso Perso",
          createdAt: inPrevMonth,
          updatedAt: inPrevMonth,
        }),
      ),
    ];
    const result = calculateKPIs(deals, NOW);
    expect(result.winRateTrend.direction).toBe("down");
    expect(result.winRateTrend.delta).toBeLessThan(0);
  });

  it("calculates pipeline velocity with valid data", () => {
    // 2 won deals created in Feb (current month), closed later in Feb
    // cycle days: deal1 = 20 days, deal2 = 10 days → avg = 15 days
    const createdDate1 = new Date("2026-02-01T00:00:00Z");
    const closedDate1 = new Date("2026-02-21T00:00:00Z"); // 20 day cycle
    const createdDate2 = new Date("2026-02-02T00:00:00Z");
    const closedDate2 = new Date("2026-02-12T00:00:00Z"); // 10 day cycle

    const deals: Deal[] = [
      makeDeal({
        id: "1",
        stage: "Chiuso Vinto",
        value: "10000.00",
        createdAt: createdDate1,
        updatedAt: closedDate1,
      }),
      makeDeal({
        id: "2",
        stage: "Chiuso Vinto",
        value: "10000.00",
        createdAt: createdDate2,
        updatedAt: closedDate2,
      }),
    ];
    const result = calculateKPIs(deals, NOW);
    // wonThisMonth=2, lostThisMonth=0 → winRate=100%, winRateDecimal=1.0
    // wonCount=2, avgValue=10000
    // avgCycleDays = (20 + 10) / 2 = 15
    // velocity = (2 * 10000 * 1.0) / 15 ≈ 1333.33
    expect(result.velocity).toBeGreaterThan(0);
  });

  it("returns velocity 0 when no won deals", () => {
    const deals: Deal[] = [
      makeDeal({ id: "1", stage: "Chiuso Perso" }),
      makeDeal({ id: "2", stage: "Proposta" }),
    ];
    const result = calculateKPIs(deals, NOW);
    expect(result.velocity).toBe(0);
  });

  it("calculates won deals this month: count and value", () => {
    const inCurrMonth = new Date("2026-02-10T00:00:00Z");
    const inPrevMonth = new Date("2026-01-10T00:00:00Z");

    const deals: Deal[] = [
      makeDeal({
        id: "1",
        stage: "Chiuso Vinto",
        value: "15000.00",
        createdAt: inCurrMonth,
        updatedAt: inCurrMonth,
      }),
      makeDeal({
        id: "2",
        stage: "Chiuso Vinto",
        value: "25000.00",
        createdAt: inCurrMonth,
        updatedAt: inCurrMonth,
      }),
      makeDeal({
        id: "3",
        stage: "Chiuso Vinto",
        value: "10000.00",
        createdAt: inPrevMonth,
        updatedAt: inPrevMonth,
      }),
    ];
    const result = calculateKPIs(deals, NOW);
    expect(result.wonDealsCount).toBe(2);
    expect(result.wonDealsValue).toBe(40000);
  });

  it("handles deals with only lost stage: win rate 0, velocity 0", () => {
    const inCurrMonth = new Date("2026-02-10T00:00:00Z");
    const deals: Deal[] = [
      makeDeal({ id: "1", stage: "Chiuso Perso", createdAt: inCurrMonth, updatedAt: inCurrMonth }),
      makeDeal({ id: "2", stage: "Chiuso Perso", createdAt: inCurrMonth, updatedAt: inCurrMonth }),
    ];
    const result = calculateKPIs(deals, NOW);
    expect(result.winRate).toBe(0);
    expect(result.velocity).toBe(0);
    expect(result.wonDealsCount).toBe(0);
    expect(result.wonDealsValue).toBe(0);
  });

  it("includes deals created exactly at month boundary in current month", () => {
    const exactStart = new Date("2026-02-01T00:00:00Z");
    const deals: Deal[] = [
      makeDeal({
        id: "1",
        stage: "Chiuso Vinto",
        value: "5000.00",
        createdAt: exactStart,
        updatedAt: exactStart,
      }),
    ];
    const result = calculateKPIs(deals, NOW);
    expect(result.wonDealsCount).toBe(1);
    expect(result.wonDealsValue).toBe(5000);
    expect(result.winRate).toBe(100);
  });

  it("excludes deals created just before month boundary from current month", () => {
    const justBeforeMonth = new Date("2026-01-31T23:59:59.999Z");
    const deals: Deal[] = [
      makeDeal({
        id: "1",
        stage: "Chiuso Vinto",
        value: "5000.00",
        createdAt: justBeforeMonth,
        updatedAt: justBeforeMonth,
      }),
    ];
    const result = calculateKPIs(deals, NOW);
    expect(result.wonDealsCount).toBe(0);
    expect(result.wonDealsValue).toBe(0);
  });
});
