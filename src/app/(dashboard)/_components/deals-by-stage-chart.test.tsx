import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DealsByStageChart } from "./deals-by-stage-chart";
import type { DealsByStageItem } from "../_lib/dashboard.service";

// Recharts uses browser APIs (ResizeObserver, SVG layout) not available in jsdom.
// Mock to render predictable DOM output for testing.
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  BarChart: ({ children, data }: { children: React.ReactNode; data: DealsByStageItem[] }) => (
    <div>
      {data.map((d) => (
        <span key={d.stage} data-testid={`stage-${d.stage}`}>
          {d.stage}
        </span>
      ))}
      {children}
    </div>
  ),
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
}));

const mockData: DealsByStageItem[] = [
  { stage: "Proposta", count: 3, totalValue: 30000 },
  { stage: "Demo", count: 1, totalValue: 5000 },
];

describe("DealsByStageChart", () => {
  it("renders without crash with empty data", () => {
    render(<DealsByStageChart data={[]} />);
    expect(screen.getByText("Nessun deal in pipeline")).toBeInTheDocument();
  });

  it("renders without crash with valid data", () => {
    render(<DealsByStageChart data={mockData} />);
    expect(screen.getByText("Deal per Stage")).toBeInTheDocument();
  });

  it("shows each stage name in the DOM with valid data", () => {
    render(<DealsByStageChart data={mockData} />);
    expect(screen.getByText("Proposta")).toBeInTheDocument();
    expect(screen.getByText("Demo")).toBeInTheDocument();
  });
});
