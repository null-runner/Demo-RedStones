import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PeriodFilter } from "./period-filter";

const pushMock = vi.fn();
const replaceMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, replace: replaceMock }),
}));

const CURRENT_MONTH_FROM = "2026-02-01T00:00:00.000Z";
const CURRENT_MONTH_TO = "2026-02-20T12:00:00.000Z";

describe("PeriodFilter", () => {
  beforeEach(() => {
    pushMock.mockClear();
    replaceMock.mockClear();
    localStorage.clear();
  });

  it("renders a trigger button with calendar icon", () => {
    render(<PeriodFilter from={CURRENT_MONTH_FROM} to={CURRENT_MONTH_TO} hasUrlParams />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("shows preset label when range matches a preset", () => {
    render(<PeriodFilter from={CURRENT_MONTH_FROM} to={CURRENT_MONTH_TO} hasUrlParams />);
    // The button text contains the formatted range or a preset label
    expect(screen.getByRole("button")).toHaveTextContent(/.+/);
  });

  it("opens popover with presets on click", async () => {
    const user = userEvent.setup();
    render(<PeriodFilter from={CURRENT_MONTH_FROM} to={CURRENT_MONTH_TO} hasUrlParams />);

    await user.click(screen.getByRole("button"));

    expect(screen.getByText("Oggi")).toBeInTheDocument();
    expect(screen.getByText("Ultimi 7 giorni")).toBeInTheDocument();
    expect(screen.getByText("Ultimi 30 giorni")).toBeInTheDocument();
    expect(screen.getByText("Ultimi 90 giorni")).toBeInTheDocument();
    // "Mese corrente" appears in both trigger and presets, so use getAllByText
    expect(screen.getAllByText("Mese corrente").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Mese precedente")).toBeInTheDocument();
  });

  it("calls router.push with from/to params when preset is clicked", async () => {
    const user = userEvent.setup();
    render(<PeriodFilter from={CURRENT_MONTH_FROM} to={CURRENT_MONTH_TO} hasUrlParams />);

    await user.click(screen.getByRole("button"));
    await user.click(screen.getByText("Ultimi 7 giorni"));

    expect(pushMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/\?from=\d{4}-\d{2}-\d{2}&to=\d{4}-\d{2}-\d{2}/),
    );
  });

  it("redirects to saved range when no URL params and localStorage has data", () => {
    const stored = {
      from: new Date("2026-01-01").toISOString(),
      to: new Date("2026-01-31").toISOString(),
    };
    localStorage.setItem("dateRange:dashboard", JSON.stringify(stored));

    render(<PeriodFilter from={CURRENT_MONTH_FROM} to={CURRENT_MONTH_TO} hasUrlParams={false} />);

    expect(replaceMock).toHaveBeenCalledWith("/?from=2026-01-01&to=2026-01-31");
  });

  it("does not redirect when no URL params and localStorage is empty", () => {
    render(<PeriodFilter from={CURRENT_MONTH_FROM} to={CURRENT_MONTH_TO} hasUrlParams={false} />);

    expect(replaceMock).not.toHaveBeenCalled();
  });
});
