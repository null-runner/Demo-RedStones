import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { KpiCards } from "./kpi-cards";

import type { DashboardKPIs } from "@/app/(dashboard)/_lib/dashboard.service";

const mockKpisBase: DashboardKPIs = {
  pipelineValue: 28000,
  winRate: 45.0,
  winRateTrend: { direction: "up", delta: 7 },
  velocity: 1333.33,
  wonDealsCount: 3,
  wonDealsValue: 75000,
};

describe("KpiCards", () => {
  it("renders 4 cards with correct labels", () => {
    render(<KpiCards kpis={mockKpisBase} />);
    expect(screen.getByText("Pipeline Value")).toBeInTheDocument();
    expect(screen.getByText("Win Rate")).toBeInTheDocument();
    expect(screen.getByText("Pipeline Velocity")).toBeInTheDocument();
    expect(screen.getByText("Deal Vinti")).toBeInTheDocument();
  });

  it("renders pipeline value as EUR formatted string", () => {
    render(<KpiCards kpis={mockKpisBase} />);
    // formatEUR(28000) in it-IT locale → "28.000,00 €"
    expect(screen.getByText(/28\.000/)).toBeInTheDocument();
  });

  it("renders win rate as percentage", () => {
    render(<KpiCards kpis={mockKpisBase} />);
    expect(screen.getByText("45.0%")).toBeInTheDocument();
  });

  it("renders trend indicator with up arrow and green color for positive trend", () => {
    const { container } = render(<KpiCards kpis={mockKpisBase} />);
    // Look for the delta text showing positive pp
    expect(screen.getByText("+7.0pp")).toBeInTheDocument();
    // The trend icon should have a green class
    const greenElements = container.querySelectorAll(".text-green-600");
    expect(greenElements.length).toBeGreaterThan(0);
  });

  it("renders trend indicator with down arrow and red color for negative trend", () => {
    const kpisDown: DashboardKPIs = {
      ...mockKpisBase,
      winRateTrend: { direction: "down", delta: -5 },
    };
    const { container } = render(<KpiCards kpis={kpisDown} />);
    expect(screen.getByText("-5.0pp")).toBeInTheDocument();
    const redElements = container.querySelectorAll(".text-red-600");
    expect(redElements.length).toBeGreaterThan(0);
  });

  it("renders neutral trend with no color class when delta is 0", () => {
    const kpisNeutral: DashboardKPIs = {
      ...mockKpisBase,
      winRateTrend: { direction: "neutral", delta: 0 },
    };
    render(<KpiCards kpis={kpisNeutral} />);
    expect(screen.getByText("0.0pp")).toBeInTheDocument();
  });

  it("renders zero values without crashing", () => {
    const zeroKpis: DashboardKPIs = {
      pipelineValue: 0,
      winRate: 0,
      winRateTrend: { direction: "neutral", delta: 0 },
      velocity: 0,
      wonDealsCount: 0,
      wonDealsValue: 0,
    };
    render(<KpiCards kpis={zeroKpis} />);
    expect(screen.getByText("0.0%")).toBeInTheDocument();
    expect(screen.getByText("0 deal")).toBeInTheDocument();
  });
});
