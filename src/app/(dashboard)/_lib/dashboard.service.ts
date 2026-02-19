import "server-only";

import { db } from "@/server/db";
import { deals } from "@/server/db/schema";
import type { Deal } from "@/server/db/schema";

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

const TERMINAL_WON = "Chiuso Vinto";
const TERMINAL_LOST = "Chiuso Perso";

function getMonthBoundaries(now: Date) {
  const year = now.getFullYear();
  const month = now.getMonth();
  const startOfMonth = new Date(year, month, 1);
  const startOfPrevMonth = new Date(year, month - 1, 1);
  const endOfPrevMonth = new Date(year, month, 0, 23, 59, 59, 999);
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
    .filter((d) => d.stage !== TERMINAL_WON && d.stage !== TERMINAL_LOST)
    .reduce((sum, d) => sum + parseFloat(d.value), 0);

  const wonThisMonth = allDeals.filter(
    (d) => d.stage === TERMINAL_WON && d.createdAt >= startOfMonth,
  );
  const lostThisMonth = allDeals.filter(
    (d) => d.stage === TERMINAL_LOST && d.createdAt >= startOfMonth,
  );
  const winRate = calcWinRate(wonThisMonth.length, lostThisMonth.length);

  const wonPrevMonth = allDeals.filter(
    (d) =>
      d.stage === TERMINAL_WON && d.createdAt >= startOfPrevMonth && d.createdAt <= endOfPrevMonth,
  );
  const lostPrevMonth = allDeals.filter(
    (d) =>
      d.stage === TERMINAL_LOST && d.createdAt >= startOfPrevMonth && d.createdAt <= endOfPrevMonth,
  );
  const winRatePrev = calcWinRate(wonPrevMonth.length, lostPrevMonth.length);

  const delta = Math.round((winRate - winRatePrev) * 10) / 10;
  const direction: WinRateTrend["direction"] = delta > 0 ? "up" : delta < 0 ? "down" : "neutral";

  const allWonDeals = allDeals.filter((d) => d.stage === TERMINAL_WON);
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

async function getDashboardKPIs(): Promise<DashboardKPIs> {
  const allDeals = await db.select().from(deals);
  return calculateKPIs(allDeals);
}

export const dashboardService = { getDashboardKPIs };
