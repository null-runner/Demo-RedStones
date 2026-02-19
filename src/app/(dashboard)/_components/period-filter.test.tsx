import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PeriodFilter } from "./period-filter";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

describe("PeriodFilter", () => {
  beforeEach(() => {
    pushMock.mockClear();
  });

  it("renders without crash with current-month value", () => {
    render(<PeriodFilter value="current-month" />);
    expect(screen.getByRole("combobox", { name: "Periodo" })).toBeInTheDocument();
  });

  it("shows the trigger with current-month label", () => {
    render(<PeriodFilter value="current-month" />);
    expect(screen.getByText("Mese corrente")).toBeInTheDocument();
  });

  it("shows the Periodo: label", () => {
    render(<PeriodFilter value="current-month" />);
    expect(screen.getByText("Periodo:")).toBeInTheDocument();
  });

  it("renders all 3 period options when opened", async () => {
    const user = userEvent.setup();
    render(<PeriodFilter value="current-month" />);

    await user.click(screen.getByRole("combobox"));

    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(3);
    expect(options[0]).toHaveTextContent("Mese corrente");
    expect(options[1]).toHaveTextContent("Mese precedente");
    expect(options[2]).toHaveTextContent("Ultimi 90 giorni");
  });

  it("calls router.push with /?period=prev-month when selecting prev month", async () => {
    const user = userEvent.setup();
    render(<PeriodFilter value="current-month" />);

    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByText("Mese precedente"));

    expect(pushMock).toHaveBeenCalledWith("/?period=prev-month");
  });

  it("calls router.push with /?period=last-90-days when selecting last 90 days", async () => {
    const user = userEvent.setup();
    render(<PeriodFilter value="current-month" />);

    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByText("Ultimi 90 giorni"));

    expect(pushMock).toHaveBeenCalledWith("/?period=last-90-days");
  });

  it("calls router.push with / when selecting current month (no query param)", async () => {
    const user = userEvent.setup();
    render(<PeriodFilter value="prev-month" />);

    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByText("Mese corrente"));

    expect(pushMock).toHaveBeenCalledWith("/");
  });
});
