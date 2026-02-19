import { render, screen } from "@testing-library/react";
import { usePathname } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Sidebar } from "./sidebar";

// Vitest hoists vi.mock above all imports at runtime
vi.mock("next/navigation", () => ({
  usePathname: vi.fn().mockReturnValue("/"),
}));

describe("Sidebar", () => {
  beforeEach(() => {
    vi.mocked(usePathname).mockReturnValue("/");
  });

  it("renders all navigation links", () => {
    render(<Sidebar />);
    expect(screen.getByRole("link", { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /contatti/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /aziende/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /pipeline/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /impostazioni/i })).toBeInTheDocument();
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

  it("marks active link with aria-current='page'", () => {
    vi.mocked(usePathname).mockReturnValue("/contacts");

    render(<Sidebar />);
    const contactsLink = screen.getByRole("link", { name: /contatti/i });
    expect(contactsLink).toHaveAttribute("aria-current", "page");
  });

  it("does not mark inactive links with aria-current", () => {
    vi.mocked(usePathname).mockReturnValue("/contacts");

    render(<Sidebar />);
    const dashboardLink = screen.getByRole("link", { name: /dashboard/i });
    expect(dashboardLink).not.toHaveAttribute("aria-current");
  });
});
