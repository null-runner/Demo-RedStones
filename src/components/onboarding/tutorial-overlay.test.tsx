import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { TutorialOverlay } from "./tutorial-overlay";

// Mock next-auth session
vi.mock("next-auth/react", () => ({
  useSession: vi.fn(),
}));

const { useSession } = vi.mocked(await import("next-auth/react"));

function mockGuest() {
  useSession.mockReturnValue({
    data: {
      user: {
        id: "guest-1",
        role: "guest",
        name: "Demo Guest",
        email: "guest@demo.redstones.local",
      },
      expires: "",
    },
    status: "authenticated",
    update: vi.fn(),
  } as unknown as ReturnType<typeof useSession>);
}

function mockAdmin() {
  useSession.mockReturnValue({
    data: {
      user: { id: "admin-1", role: "admin", name: "Admin", email: "admin@demo.redstones.local" },
      expires: "",
    },
    status: "authenticated",
    update: vi.fn(),
  } as unknown as ReturnType<typeof useSession>);
}

describe("TutorialOverlay", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders for guest users who haven't seen tutorial", () => {
    mockGuest();
    render(<TutorialOverlay />);
    expect(screen.getByText("Benvenuto in RedStones CRM")).toBeInTheDocument();
  });

  it("does not render for non-guest users", () => {
    mockAdmin();
    render(<TutorialOverlay />);
    expect(screen.queryByText("Benvenuto in RedStones CRM")).not.toBeInTheDocument();
  });

  it("does not render if tutorial was already completed", () => {
    localStorage.setItem("crm-tutorial-completed", "true");
    mockGuest();
    render(<TutorialOverlay />);
    expect(screen.queryByText("Benvenuto in RedStones CRM")).not.toBeInTheDocument();
  });

  it("shows skip button that dismisses overlay", async () => {
    mockGuest();
    const user = userEvent.setup();
    render(<TutorialOverlay />);

    const skipBtn = screen.getByRole("button", { name: /salta/i });
    expect(skipBtn).toBeInTheDocument();

    await user.click(skipBtn);
    expect(screen.queryByText("Benvenuto in RedStones CRM")).not.toBeInTheDocument();
    expect(localStorage.getItem("crm-tutorial-completed")).toBe("true");
  });

  it("navigates through steps with next button", async () => {
    mockGuest();
    const user = userEvent.setup();
    render(<TutorialOverlay />);

    // Step 1: Welcome
    expect(screen.getByText("Benvenuto in RedStones CRM")).toBeInTheDocument();

    // Click next
    await user.click(screen.getByRole("button", { name: /avanti/i }));

    // Step 2: should show different content
    expect(screen.queryByText("Benvenuto in RedStones CRM")).not.toBeInTheDocument();
  });

  it("completes tutorial on last step", async () => {
    mockGuest();
    const user = userEvent.setup();
    render(<TutorialOverlay />);

    // Navigate through all steps
    const nextBtn = () => screen.getByRole("button", { name: /avanti|inizia/i });

    // Click through steps until we can't find next anymore
    let steps = 0;
    while (screen.queryByRole("button", { name: /avanti|inizia/i })) {
      await user.click(nextBtn());
      steps++;
      if (steps > 10) break; // safety
    }

    expect(localStorage.getItem("crm-tutorial-completed")).toBe("true");
  });

  it("shows step indicators", () => {
    mockGuest();
    render(<TutorialOverlay />);

    // Should show step indicator dots
    const dots = screen.getAllByTestId("step-dot");
    expect(dots.length).toBeGreaterThan(1);
  });
});
