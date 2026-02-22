import "server-only";

import { cache } from "react";
import { gte, not, inArray as drizzleInArray } from "drizzle-orm";

import { getAllSuggestions } from "./nba.service";
import type { ContactWithLastActivity, NbaResult } from "./nba.service";

import { db } from "@/server/db";
import { contacts, deals, timelineEntries } from "@/server/db/schema";
import type { Deal, TimelineEntry } from "@/server/db/schema";
import { sumCurrency, toCents } from "@/lib/format";
import { isTerminalStage, TERMINAL_STAGES } from "@/lib/constants/pipeline";

export type PeriodFilterPreset = "current-month" | "prev-month" | "last-90-days";
export type PeriodFilter = PeriodFilterPreset | PeriodDateRange;

export type PeriodDateRange = {
  start: Date;
  end: Date;
  prevStart: Date;
  prevEnd: Date;
};

export type DealsByStageItem = {
  stage: string;
  count: number;
  totalValue: number;
};

export type StagnantDeal = {
  id: string;
  title: string;
  stage: string;
  daysInactive: number;
  value: number;
};

export type DealStatusItem = {
  status: string;
  count: number;
  totalValue: number;
  color: string;
};

export type DashboardData = {
  kpis: DashboardKPIs;
  dealsByStage: DealsByStageItem[];
  dealsByStatus: DealStatusItem[];
  stagnantDeals: StagnantDeal[];
};

export const STAGNANT_THRESHOLD_DAYS = 14;

export type WinRateTrend = {
  direction: "up" | "down" | "neutral";
  delta: number;
};

export type DashboardKPIs = {
  pipelineValue: number;
  winRate: number;
  winRateTrend: WinRateTrend;
  velocity: number;
  wonDealsCount: number;
  wonDealsValue: number;
};

const STAGE_WON = TERMINAL_STAGES[0]; // "Chiuso Vinto"
const STAGE_LOST = TERMINAL_STAGES[1]; // "Chiuso Perso"

export function getPeriodDateRange(
  period: PeriodFilterPreset,
  now: Date = new Date(),
): PeriodDateRange {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();

  if (period === "current-month") {
    return {
      start: new Date(Date.UTC(year, month, 1)),
      end: now,
      prevStart: new Date(Date.UTC(year, month - 1, 1)),
      prevEnd: new Date(Date.UTC(year, month, 0, 23, 59, 59, 999)),
    };
  }

  if (period === "prev-month") {
    return {
      start: new Date(Date.UTC(year, month - 1, 1)),
      end: new Date(Date.UTC(year, month, 0, 23, 59, 59, 999)),
      prevStart: new Date(Date.UTC(year, month - 2, 1)),
      prevEnd: new Date(Date.UTC(year, month - 1, 0, 23, 59, 59, 999)),
    };
  }

  const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;
  return {
    start: new Date(now.getTime() - ninetyDaysMs),
    end: now,
    prevStart: new Date(now.getTime() - 2 * ninetyDaysMs),
    prevEnd: new Date(now.getTime() - ninetyDaysMs - 1),
  };
}

export function customDateRange(from: Date, to: Date): PeriodDateRange {
  const durationMs = to.getTime() - from.getTime();
  return {
    start: from,
    end: to,
    prevStart: new Date(from.getTime() - durationMs - 1),
    prevEnd: new Date(from.getTime() - 1),
  };
}

function resolvePeriod(period: PeriodFilter, now: Date): PeriodDateRange {
  return typeof period === "string" ? getPeriodDateRange(period, now) : period;
}

function calcWinRate(won: number, lost: number): number {
  const total = won + lost;
  if (total === 0) return 0;
  return (won / total) * 100;
}

// Pipeline velocity formula: (wonCount × avgValue × winRateDecimal) / avgCycleDays
// Returns EUR/day; 0 if no won deals exist
function calcVelocity(allWonDeals: Deal[], winRateDecimal: number): number {
  const wonCount = allWonDeals.length;
  if (wonCount === 0) return 0;

  const totalValue = sumCurrency(allWonDeals.map((d) => d.value));
  const avgValue = totalValue / wonCount;

  const totalCycleDays = allWonDeals.reduce((sum, d) => {
    const cycleDays = (d.updatedAt.getTime() - d.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    return sum + cycleDays;
  }, 0);
  const avgCycleDays = totalCycleDays / wonCount;
  const safeCycleDays = avgCycleDays <= 0 ? 1 : avgCycleDays;

  return (wonCount * avgValue * winRateDecimal) / safeCycleDays;
}

export function calculateKPIs(
  allDeals: Deal[],
  now: Date = new Date(),
  period: PeriodFilter = "current-month",
): DashboardKPIs {
  const { start, end, prevStart, prevEnd } = resolvePeriod(period, now);

  const pipelineDeals = allDeals.filter(
    (d) => !isTerminalStage(d.stage) && d.createdAt >= start && d.createdAt <= end,
  );
  const pipelineValue = sumCurrency(pipelineDeals.map((d) => d.value));

  const wonCurrent = allDeals.filter(
    (d) => d.stage === STAGE_WON && d.createdAt >= start && d.createdAt <= end,
  );
  const lostCurrent = allDeals.filter(
    (d) => d.stage === STAGE_LOST && d.createdAt >= start && d.createdAt <= end,
  );
  const winRate = calcWinRate(wonCurrent.length, lostCurrent.length);

  const wonPrev = allDeals.filter(
    (d) => d.stage === STAGE_WON && d.createdAt >= prevStart && d.createdAt <= prevEnd,
  );
  const lostPrev = allDeals.filter(
    (d) => d.stage === STAGE_LOST && d.createdAt >= prevStart && d.createdAt <= prevEnd,
  );
  const winRatePrev = calcWinRate(wonPrev.length, lostPrev.length);

  const delta = Math.round((winRate - winRatePrev) * 10) / 10;
  const direction: WinRateTrend["direction"] = delta > 0 ? "up" : delta < 0 ? "down" : "neutral";

  const winRateDecimal = winRate / 100;
  const velocity = calcVelocity(wonCurrent, winRateDecimal);

  return {
    pipelineValue,
    winRate,
    winRateTrend: { direction, delta },
    velocity,
    wonDealsCount: wonCurrent.length,
    wonDealsValue: sumCurrency(wonCurrent.map((d) => d.value)),
  };
}

export function calculateDealsPerStage(allDeals: Deal[]): DealsByStageItem[] {
  const activeDeals = allDeals.filter((d) => !isTerminalStage(d.stage));
  const stageMap = new Map<string, { count: number; totalValue: number }>();

  for (const deal of activeDeals) {
    const current = stageMap.get(deal.stage) ?? { count: 0, totalValue: 0 };
    stageMap.set(deal.stage, {
      count: current.count + 1,
      totalValue: (Math.round(current.totalValue * 100) + toCents(deal.value)) / 100,
    });
  }

  return Array.from(stageMap.entries())
    .map(([stage, { count, totalValue }]) => ({ stage, count, totalValue }))
    .sort((a, b) => b.count - a.count);
}

export function calculateDealsByStatus(allDeals: Deal[]): DealStatusItem[] {
  const active = allDeals.filter((d) => !isTerminalStage(d.stage));
  const won = allDeals.filter((d) => d.stage === STAGE_WON);
  const lost = allDeals.filter((d) => d.stage === STAGE_LOST);

  return [
    {
      status: "Attivi",
      count: active.length,
      totalValue: sumCurrency(active.map((d) => d.value)),
      color: "#3b82f6",
    },
    {
      status: "Vinti",
      count: won.length,
      totalValue: sumCurrency(won.map((d) => d.value)),
      color: "#22c55e",
    },
    {
      status: "Persi",
      count: lost.length,
      totalValue: sumCurrency(lost.map((d) => d.value)),
      color: "#ef4444",
    },
  ].filter((item) => item.count > 0);
}

export function getStagnantDeals(allDeals: Deal[], now: Date = new Date()): StagnantDeal[] {
  const thresholdMs = STAGNANT_THRESHOLD_DAYS * 24 * 60 * 60 * 1000;
  const thresholdDate = new Date(now.getTime() - thresholdMs);

  return allDeals
    .filter((d) => !isTerminalStage(d.stage) && d.updatedAt < thresholdDate)
    .map((d) => ({
      id: d.id,
      title: d.title,
      stage: d.stage,
      daysInactive: Math.floor((now.getTime() - d.updatedAt.getTime()) / (1000 * 60 * 60 * 24)),
      value: parseFloat(d.value),
    }))
    .sort((a, b) => b.daysInactive - a.daysInactive);
}

async function getDashboardData(
  period: PeriodFilter = "current-month",
  now: Date = new Date(),
): Promise<DashboardData> {
  const { start, end, prevStart } = resolvePeriod(period, now);

  // Fetch only deals relevant to current + previous period (not entire history)
  const allDeals = await db.select().from(deals).where(gte(deals.createdAt, prevStart));
  const periodDeals = allDeals.filter((d) => d.createdAt >= start && d.createdAt <= end);

  return {
    kpis: calculateKPIs(allDeals, now, period),
    dealsByStage: calculateDealsPerStage(periodDeals),
    dealsByStatus: calculateDealsByStatus(periodDeals),
    stagnantDeals: getStagnantDeals(periodDeals, now),
  };
}

const getNbaData = cache(async (): Promise<NbaResult> => {
  // Fetch only active deals (not terminal) — avoids loading entire history
  const activeDeals = await db
    .select()
    .from(deals)
    .where(not(drizzleInArray(deals.stage, TERMINAL_STAGES)));

  const activeDealIds = activeDeals.map((d) => d.id);
  const activeContactIds = activeDeals.map((d) => d.contactId).filter(Boolean) as string[];

  // Fetch only contacts and timeline relevant to active deals
  const [allContacts, allTimelineEntries] = await Promise.all([
    activeContactIds.length > 0
      ? db.select().from(contacts).where(drizzleInArray(contacts.id, activeContactIds))
      : Promise.resolve([]),
    activeDealIds.length > 0
      ? db
          .select()
          .from(timelineEntries)
          .where(drizzleInArray(timelineEntries.dealId, activeDealIds))
      : Promise.resolve([]),
  ]);

  const entriesByDealId = new Map<string, TimelineEntry[]>();
  for (const entry of allTimelineEntries) {
    const existing = entriesByDealId.get(entry.dealId) ?? [];
    existing.push(entry);
    entriesByDealId.set(entry.dealId, existing);
  }

  const dealsByContactId = new Map<string, Deal[]>();
  for (const deal of activeDeals) {
    if (deal.contactId) {
      const existing = dealsByContactId.get(deal.contactId) ?? [];
      existing.push(deal);
      dealsByContactId.set(deal.contactId, existing);
    }
  }

  const contactsWithActivity: ContactWithLastActivity[] = allContacts.map((contact) => {
    const contactDeals = dealsByContactId.get(contact.id) ?? [];
    let lastActivityDate: Date | null = null;
    for (const deal of contactDeals) {
      const entries = entriesByDealId.get(deal.id) ?? [];
      for (const entry of entries) {
        if (!lastActivityDate || entry.createdAt > lastActivityDate) {
          lastActivityDate = entry.createdAt;
        }
      }
    }
    return { ...contact, lastActivityDate };
  });

  return getAllSuggestions(activeDeals, contactsWithActivity, entriesByDealId);
});

export const dashboardService = { getDashboardData, getNbaData };
