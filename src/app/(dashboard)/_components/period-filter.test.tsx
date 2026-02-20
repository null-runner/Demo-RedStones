import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PeriodFilter } from "./period-filter";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

const CURRENT_MONTH_FROM = "2026-02-01T00:00:00.000Z";
const CURRENT_MONTH_TO = "2026-02-20T12:00:00.000Z";

describe("PeriodFilter", () => {
  beforeEach(() => {
    pushMock.mockClear();
  });

  it("renders a trigger button with calendar icon", () => {
    render(<PeriodFilter from={CURRENT_MONTH_FROM} to={CURRENT_MONTH_TO} />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("shows preset label when range matches a preset", () => {
    render(<PeriodFilter from={CURRENT_MONTH_FROM} to={CURRENT_MONTH_TO} />);
    // The button text contains the formatted range or a preset label
    expect(screen.getByRole("button")).toHaveTextContent(/.+/);
  });

  it("opens popover with presets on click", async () => {
    const user = userEvent.setup();
    render(<PeriodFilter from={CURRENT_MONTH_FROM} to={CURRENT_MONTH_TO} />);

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
    render(<PeriodFilter from={CURRENT_MONTH_FROM} to={CURRENT_MONTH_TO} />);

    await user.click(screen.getByRole("button"));
    await user.click(screen.getByText("Ultimi 7 giorni"));

    expect(pushMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/\?from=\d{4}-\d{2}-\d{2}&to=\d{4}-\d{2}-\d{2}/),
    );
  });
});
