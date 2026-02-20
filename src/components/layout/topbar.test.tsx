import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

import { Topbar } from "./topbar";

const emptyDataset = { contacts: [], companies: [], deals: [] };

describe("Topbar", () => {
  it("renders demo mode badge", () => {
    render(<Topbar searchDataset={emptyDataset} />);
    expect(screen.getByText("Demo Mode")).toBeInTheDocument();
  });

  it("renders search hint with keyboard shortcut", () => {
    render(<Topbar searchDataset={emptyDataset} />);
    expect(screen.getByText("⌘K")).toBeInTheDocument();
  });

  it("search button has accessible label", () => {
    render(<Topbar searchDataset={emptyDataset} />);
    expect(screen.getByRole("button", { name: /ricerca/i })).toBeInTheDocument();
  });
});
