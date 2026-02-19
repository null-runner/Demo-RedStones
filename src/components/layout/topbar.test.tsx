import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Topbar } from "./topbar";

describe("Topbar", () => {
  it("renders demo mode badge", () => {
    render(<Topbar />);
    expect(screen.getByText("Demo Mode")).toBeInTheDocument();
  });

  it("renders search hint with keyboard shortcut", () => {
    render(<Topbar />);
    expect(screen.getByText("⌘K")).toBeInTheDocument();
  });

  it("search button has accessible label", () => {
    render(<Topbar />);
    expect(screen.getByRole("button", { name: /ricerca/i })).toBeInTheDocument();
  });
});
