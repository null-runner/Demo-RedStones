import { render, screen } from "@testing-library/react";
import { useSession } from "next-auth/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("next-auth/react", () => ({
  useSession: vi.fn(() => ({ data: null, status: "unauthenticated" })),
  signOut: vi.fn(),
}));

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

  it("shows user name and logout button when authenticated", () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: { id: "1", name: "Mario Rossi", email: "mario@test.com", role: "member" },
        expires: "",
      },
      status: "authenticated",
      update: vi.fn(),
    });

    render(<Topbar searchDataset={emptyDataset} />);
    expect(screen.getByText("Mario Rossi")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /esci/i })).toBeInTheDocument();
  });

  it("does not show logout button when unauthenticated", () => {
    vi.mocked(useSession).mockReturnValue({
      data: null,
      status: "unauthenticated",
      update: vi.fn(),
    });

    render(<Topbar searchDataset={emptyDataset} />);
    expect(screen.queryByRole("button", { name: /esci/i })).not.toBeInTheDocument();
  });
});
