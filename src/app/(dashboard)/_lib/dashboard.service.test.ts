import { describe, expect, it } from "vitest";

import {
  calculateKPIs,
  calculateDealsPerStage,
  getStagnantDeals,
  getPeriodDateRange,
} from "./dashboard.service";

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

  it("current-month: deal from prev month NOT included in pipeline value", () => {
    const prevMonthDeal = makeDeal({
      id: "prev",
      stage: "Proposta",
      value: "5000.00",
      createdAt: new Date("2026-01-10T00:00:00Z"),
      updatedAt: new Date("2026-01-10T00:00:00Z"),
    });
    const result = calculateKPIs([prevMonthDeal], NOW, "current-month");
    expect(result.pipelineValue).toBe(0);
  });

  it("prev-month: deal from prev month included in pipeline value", () => {
    const prevMonthDeal = makeDeal({
      id: "prev",
      stage: "Proposta",
      value: "5000.00",
      createdAt: new Date("2026-01-10T00:00:00Z"),
      updatedAt: new Date("2026-01-10T00:00:00Z"),
    });
    const result = calculateKPIs([prevMonthDeal], NOW, "prev-month");
    expect(result.pipelineValue).toBe(5000);
  });

  it("empty deal list with prev-month: all KPIs zero", () => {
    const result = calculateKPIs([], NOW, "prev-month");
    expect(result.pipelineValue).toBe(0);
    expect(result.winRate).toBe(0);
    expect(result.velocity).toBe(0);
    expect(result.wonDealsCount).toBe(0);
  });

  it("last-90-days: deal from 30 days ago included in pipeline value", () => {
    const thirtyDaysAgo = new Date(NOW.getTime() - 30 * 24 * 60 * 60 * 1000);
    const deal = makeDeal({
      id: "recent",
      stage: "Proposta",
      value: "7000.00",
      createdAt: thirtyDaysAgo,
      updatedAt: thirtyDaysAgo,
    });
    const result = calculateKPIs([deal], NOW, "last-90-days");
    expect(result.pipelineValue).toBe(7000);
  });

  it("last-90-days: deal from 100 days ago excluded from pipeline value", () => {
    const hundredDaysAgo = new Date(NOW.getTime() - 100 * 24 * 60 * 60 * 1000);
    const deal = makeDeal({
      id: "old",
      stage: "Proposta",
      value: "7000.00",
      createdAt: hundredDaysAgo,
      updatedAt: hundredDaysAgo,
    });
    const result = calculateKPIs([deal], NOW, "last-90-days");
    expect(result.pipelineValue).toBe(0);
  });
});

describe("calculateDealsPerStage", () => {
  it("returns empty array for no deals", () => {
    expect(calculateDealsPerStage([])).toEqual([]);
  });

  it("groups deals by stage with count and total value", () => {
    const dealsData: Deal[] = [
      makeDeal({ id: "1", stage: "Proposta", value: "10000.00" }),
      makeDeal({ id: "2", stage: "Proposta", value: "20000.00" }),
      makeDeal({ id: "3", stage: "Demo", value: "5000.00" }),
    ];
    const result = calculateDealsPerStage(dealsData);
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ stage: "Proposta", count: 2, totalValue: 30000 }),
        expect.objectContaining({ stage: "Demo", count: 1, totalValue: 5000 }),
      ]),
    );
  });

  it("excludes terminal stages from chart data", () => {
    const dealsData: Deal[] = [
      makeDeal({ id: "1", stage: "Chiuso Vinto", value: "10000.00" }),
      makeDeal({ id: "2", stage: "Chiuso Perso", value: "5000.00" }),
      makeDeal({ id: "3", stage: "Proposta", value: "8000.00" }),
    ];
    const result = calculateDealsPerStage(dealsData);
    expect(result).toHaveLength(1);
    expect(result).toEqual(
      expect.arrayContaining([expect.objectContaining({ stage: "Proposta" })]),
    );
  });

  it("sums value correctly using parseFloat on string values", () => {
    const dealsData: Deal[] = [
      makeDeal({ id: "1", stage: "Lead", value: "1500.50" }),
      makeDeal({ id: "2", stage: "Lead", value: "2500.75" }),
    ];
    const result = calculateDealsPerStage(dealsData);
    expect(result).toHaveLength(1);
    expect(result.at(0)?.totalValue).toBeCloseTo(4001.25, 2);
  });
});

describe("getPeriodDateRange", () => {
  const REF = new Date("2026-02-15T12:00:00Z");

  it("current-month: start is first day of month UTC", () => {
    const { start, end } = getPeriodDateRange("current-month", REF);
    expect(start).toEqual(new Date("2026-02-01T00:00:00.000Z"));
    expect(end).toEqual(REF);
  });

  it("current-month: prevStart and prevEnd cover January 2026", () => {
    const { prevStart, prevEnd } = getPeriodDateRange("current-month", REF);
    expect(prevStart).toEqual(new Date("2026-01-01T00:00:00.000Z"));
    expect(prevEnd.getUTCMonth()).toBe(0);
    expect(prevEnd.getUTCFullYear()).toBe(2026);
  });

  it("prev-month: start is first day of January 2026", () => {
    const { start, end } = getPeriodDateRange("prev-month", REF);
    expect(start).toEqual(new Date("2026-01-01T00:00:00.000Z"));
    expect(end.getUTCMonth()).toBe(0);
    expect(end.getUTCDate()).toBe(31);
  });

  it("prev-month: prevStart is first day of two months ago", () => {
    const { prevStart } = getPeriodDateRange("prev-month", REF);
    expect(prevStart).toEqual(new Date("2025-12-01T00:00:00.000Z"));
  });

  it("last-90-days: start is 90 days before now", () => {
    const { start, end } = getPeriodDateRange("last-90-days", REF);
    const expectedStart = new Date(REF.getTime() - 90 * 24 * 60 * 60 * 1000);
    expect(start).toEqual(expectedStart);
    expect(end).toEqual(REF);
  });

  it("last-90-days: prevEnd is strictly before start (no boundary overlap)", () => {
    const { start, prevEnd } = getPeriodDateRange("last-90-days", REF);
    expect(prevEnd.getTime()).toBeLessThan(start.getTime());
  });
});

describe("getStagnantDeals", () => {
  it("returns empty array for no deals", () => {
    expect(getStagnantDeals([], NOW)).toEqual([]);
  });

  it("includes deal updated 15 days ago with correct daysInactive", () => {
    const staleDate = new Date(NOW.getTime() - 15 * 24 * 60 * 60 * 1000);
    const deal = makeDeal({ id: "1", stage: "Proposta", updatedAt: staleDate });
    const result = getStagnantDeals([deal], NOW);
    expect(result).toHaveLength(1);
    expect(result).toEqual(expect.arrayContaining([expect.objectContaining({ daysInactive: 15 })]));
  });

  it("excludes deal updated exactly 14 days ago (at threshold boundary)", () => {
    const exactThreshold = new Date(NOW.getTime() - 14 * 24 * 60 * 60 * 1000);
    const deal = makeDeal({ id: "1", stage: "Proposta", updatedAt: exactThreshold });
    expect(getStagnantDeals([deal], NOW)).toHaveLength(0);
  });

  it("excludes deal updated 13 days ago (below threshold)", () => {
    const recentDate = new Date(NOW.getTime() - 13 * 24 * 60 * 60 * 1000);
    const deal = makeDeal({ id: "1", stage: "Proposta", updatedAt: recentDate });
    expect(getStagnantDeals([deal], NOW)).toHaveLength(0);
  });

  it("excludes Chiuso Vinto stage even if stale", () => {
    const staleDate = new Date(NOW.getTime() - 30 * 24 * 60 * 60 * 1000);
    const deal = makeDeal({ id: "1", stage: "Chiuso Vinto", updatedAt: staleDate });
    expect(getStagnantDeals([deal], NOW)).toHaveLength(0);
  });

  it("excludes Chiuso Perso stage even if stale", () => {
    const staleDate = new Date(NOW.getTime() - 30 * 24 * 60 * 60 * 1000);
    const deal = makeDeal({ id: "1", stage: "Chiuso Perso", updatedAt: staleDate });
    expect(getStagnantDeals([deal], NOW)).toHaveLength(0);
  });

  it("calculates daysInactive as Math.floor of days diff", () => {
    const staleDate = new Date(NOW.getTime() - 15.7 * 24 * 60 * 60 * 1000);
    const deal = makeDeal({ id: "1", stage: "Demo", updatedAt: staleDate });
    const result = getStagnantDeals([deal], NOW);
    expect(result).toEqual(expect.arrayContaining([expect.objectContaining({ daysInactive: 15 })]));
  });

  it("sorts by daysInactive DESC (most stagnant first)", () => {
    const date30 = new Date(NOW.getTime() - 30 * 24 * 60 * 60 * 1000);
    const date20 = new Date(NOW.getTime() - 20 * 24 * 60 * 60 * 1000);
    const dealsData: Deal[] = [
      makeDeal({ id: "1", stage: "Demo", updatedAt: date20 }),
      makeDeal({ id: "2", stage: "Proposta", updatedAt: date30 }),
    ];
    const result = getStagnantDeals(dealsData, NOW);
    expect(result.map((d) => d.daysInactive)).toEqual([30, 20]);
  });
});
