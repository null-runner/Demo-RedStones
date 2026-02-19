import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// Mock usePathname — must be before component import
vi.mock("next/navigation", () => ({
  usePathname: vi.fn().mockReturnValue("/"),
}));

import { Sidebar } from "./sidebar";

describe("Sidebar", () => {
  it("renders all navigation links", () => {
    render(<Sidebar />);
    expect(screen.getByRole("link", { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /contatti/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /aziende/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /pipeline/i })).toBeInTheDocument();
  });

  it("dashboard link has correct href", () => {
    render(<Sidebar />);
    expect(screen.getByRole("link", { name: /dashboard/i })).toHaveAttribute("href", "/");
  });

  it("contacts link has correct href", () => {
    render(<Sidebar />);
    expect(screen.getByRole("link", { name: /contatti/i })).toHaveAttribute("href", "/contacts");
  });

  it("companies link has correct href", () => {
    render(<Sidebar />);
    expect(screen.getByRole("link", { name: /aziende/i })).toHaveAttribute("href", "/companies");
  });

  it("deals link has correct href", () => {
    render(<Sidebar />);
    expect(screen.getByRole("link", { name: /pipeline/i })).toHaveAttribute("href", "/deals");
  });

  it("highlights active link based on pathname", async () => {
    const { usePathname } = await import("next/navigation");
    vi.mocked(usePathname).mockReturnValue("/contacts");

    render(<Sidebar />);
    const contactsLink = screen.getByRole("link", { name: /contatti/i });
    expect(contactsLink).toHaveClass("bg-accent");
  });

  it("does not highlight inactive links", async () => {
    const { usePathname } = await import("next/navigation");
    vi.mocked(usePathname).mockReturnValue("/contacts");

    render(<Sidebar />);
    const dashboardLink = screen.getByRole("link", { name: /dashboard/i });
    expect(dashboardLink).not.toHaveClass("bg-accent");
  });
});
