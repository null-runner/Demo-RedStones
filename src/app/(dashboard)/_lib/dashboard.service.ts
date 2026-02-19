import "server-only";

import { db } from "@/server/db";
import { deals } from "@/server/db/schema";
import type { Deal } from "@/server/db/schema";
import { isTerminalStage, TERMINAL_STAGES } from "@/lib/constants/pipeline";

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

export type DashboardData = {
  kpis: DashboardKPIs;
  dealsByStage: DealsByStageItem[];
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

function getMonthBoundaries(now: Date) {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const startOfMonth = new Date(Date.UTC(year, month, 1));
  const startOfPrevMonth = new Date(Date.UTC(year, month - 1, 1));
  const endOfPrevMonth = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
  return { startOfMonth, startOfPrevMonth, endOfPrevMonth };
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

  const totalValue = allWonDeals.reduce((sum, d) => sum + parseFloat(d.value), 0);
  const avgValue = totalValue / wonCount;

  const totalCycleDays = allWonDeals.reduce((sum, d) => {
    const cycleDays = (d.updatedAt.getTime() - d.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    return sum + cycleDays;
  }, 0);
  const avgCycleDays = totalCycleDays / wonCount;
  // Prevent division by zero: if avg cycle is 0, use 1 day
  const safeCycleDays = avgCycleDays <= 0 ? 1 : avgCycleDays;

  return (wonCount * avgValue * winRateDecimal) / safeCycleDays;
}

export function calculateKPIs(allDeals: Deal[], now: Date = new Date()): DashboardKPIs {
  const { startOfMonth, startOfPrevMonth, endOfPrevMonth } = getMonthBoundaries(now);

  const pipelineValue = allDeals
    .filter((d) => !isTerminalStage(d.stage))
    .reduce((sum, d) => sum + parseFloat(d.value), 0);

  const wonThisMonth = allDeals.filter((d) => d.stage === STAGE_WON && d.createdAt >= startOfMonth);
  const lostThisMonth = allDeals.filter(
    (d) => d.stage === STAGE_LOST && d.createdAt >= startOfMonth,
  );
  const winRate = calcWinRate(wonThisMonth.length, lostThisMonth.length);

  const wonPrevMonth = allDeals.filter(
    (d) =>
      d.stage === STAGE_WON && d.createdAt >= startOfPrevMonth && d.createdAt <= endOfPrevMonth,
  );
  const lostPrevMonth = allDeals.filter(
    (d) =>
      d.stage === STAGE_LOST && d.createdAt >= startOfPrevMonth && d.createdAt <= endOfPrevMonth,
  );
  const winRatePrev = calcWinRate(wonPrevMonth.length, lostPrevMonth.length);

  const delta = Math.round((winRate - winRatePrev) * 10) / 10;
  const direction: WinRateTrend["direction"] = delta > 0 ? "up" : delta < 0 ? "down" : "neutral";

  const allWonDeals = allDeals.filter((d) => d.stage === STAGE_WON);
  const winRateDecimal = winRate / 100;
  const velocity = calcVelocity(allWonDeals, winRateDecimal);

  const wonDealsCount = wonThisMonth.length;
  const wonDealsValue = wonThisMonth.reduce((sum, d) => sum + parseFloat(d.value), 0);

  return {
    pipelineValue,
    winRate,
    winRateTrend: { direction, delta },
    velocity,
    wonDealsCount,
    wonDealsValue,
  };
}

export function calculateDealsPerStage(allDeals: Deal[]): DealsByStageItem[] {
  const activeDeals = allDeals.filter((d) => !isTerminalStage(d.stage));
  const stageMap = new Map<string, { count: number; totalValue: number }>();

  for (const deal of activeDeals) {
    const current = stageMap.get(deal.stage) ?? { count: 0, totalValue: 0 };
    stageMap.set(deal.stage, {
      count: current.count + 1,
      totalValue: current.totalValue + parseFloat(deal.value),
    });
  }

  return Array.from(stageMap.entries())
    .map(([stage, { count, totalValue }]) => ({ stage, count, totalValue }))
    .sort((a, b) => b.count - a.count);
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

async function getDashboardKPIs(): Promise<DashboardKPIs> {
  const allDeals = await db.select().from(deals);
  return calculateKPIs(allDeals);
}

async function getDashboardData(now: Date = new Date()): Promise<DashboardData> {
  const allDeals = await db.select().from(deals);
  return {
    kpis: calculateKPIs(allDeals, now),
    dealsByStage: calculateDealsPerStage(allDeals),
    stagnantDeals: getStagnantDeals(allDeals, now),
  };
}

export const dashboardService = { getDashboardKPIs, getDashboardData };
