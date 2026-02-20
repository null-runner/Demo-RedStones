import { render, screen } from "@testing-library/react";
import { useSession } from "next-auth/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next-auth/react", () => ({
  useSession: vi.fn(() => ({ data: null, status: "unauthenticated" })),
}));

import { DemoBanner } from "./demo-banner";

describe("DemoBanner", () => {
  it("renders banner text when user role is guest", () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: { id: "g1", name: "Demo Guest", email: "guest@demo.redstones.local", role: "guest" },
        expires: "",
      },
      status: "authenticated",
      update: vi.fn(),
    });
    render(<DemoBanner />);
    expect(screen.getByText(/stai esplorando in modalità demo/i)).toBeInTheDocument();
  });

  it("renders nothing when user role is admin", () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: { id: "a1", name: "Admin", email: "admin@test.com", role: "admin" },
        expires: "",
      },
      status: "authenticated",
      update: vi.fn(),
    });
    const { container } = render(<DemoBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when session is absent", () => {
    vi.mocked(useSession).mockReturnValue({
      data: null,
      status: "unauthenticated",
      update: vi.fn(),
    });
    const { container } = render(<DemoBanner />);
    expect(container).toBeEmptyDOMElement();
  });
});
