import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { TimelineFeed } from "./timeline-feed";
import type { TimelineEntryWithAuthor } from "../_lib/timeline.service";

// Mock Server Action
vi.mock("../_lib/timeline.actions", () => ({
  addNote: vi.fn().mockResolvedValue({ success: true, data: {} }),
}));

// Mock useRouter
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

const mockNoteEntry: TimelineEntryWithAuthor = {
  id: "te1",
  dealId: "00000000-0000-0000-0000-000000000001",
  type: "note",
  content: "Chiamata con il cliente effettuata",
  previousStage: null,
  newStage: null,
  authorId: null,
  createdAt: new Date("2026-01-15T10:00:00Z"),
  author: null,
};

const mockStageChangeEntry: TimelineEntryWithAuthor = {
  id: "te2",
  dealId: "00000000-0000-0000-0000-000000000001",
  type: "stage_change",
  content: null,
  previousStage: "Lead",
  newStage: "Qualificato",
  authorId: null,
  createdAt: new Date("2026-01-16T10:00:00Z"),
  author: { id: "u1", name: "Jacopo Rampinelli" },
};

describe("TimelineFeed", () => {
  it("renders note entry content", () => {
    render(
      <TimelineFeed dealId="00000000-0000-0000-0000-000000000001" entries={[mockNoteEntry]} />,
    );
    expect(screen.getByText("Chiamata con il cliente effettuata")).toBeInTheDocument();
  });

  it("renders stage change entry with stage names", () => {
    render(
      <TimelineFeed
        dealId="00000000-0000-0000-0000-000000000001"
        entries={[mockStageChangeEntry]}
      />,
    );
    expect(screen.getByText(/Lead/)).toBeInTheDocument();
    expect(screen.getByText(/Qualificato/)).toBeInTheDocument();
  });

  it("renders author name when present", () => {
    render(
      <TimelineFeed
        dealId="00000000-0000-0000-0000-000000000001"
        entries={[mockStageChangeEntry]}
      />,
    );
    expect(screen.getByText("Jacopo Rampinelli")).toBeInTheDocument();
  });

  it("renders 'Sistema' when author is null", () => {
    render(
      <TimelineFeed dealId="00000000-0000-0000-0000-000000000001" entries={[mockNoteEntry]} />,
    );
    expect(screen.getByText("Sistema")).toBeInTheDocument();
  });

  it("renders add note textarea and button", () => {
    render(<TimelineFeed dealId="00000000-0000-0000-0000-000000000001" entries={[]} />);
    expect(screen.getByPlaceholderText(/nota/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /aggiungi nota/i })).toBeInTheDocument();
  });

  it("add note button is disabled when textarea is empty", () => {
    render(<TimelineFeed dealId="00000000-0000-0000-0000-000000000001" entries={[]} />);
    const button = screen.getByRole("button", { name: /aggiungi nota/i });
    expect(button).toBeDisabled();
  });

  it("add note button is enabled when textarea has content", async () => {
    const user = userEvent.setup();
    render(<TimelineFeed dealId="00000000-0000-0000-0000-000000000001" entries={[]} />);
    const textarea = screen.getByPlaceholderText(/nota/i);
    await user.type(textarea, "Nota di test");
    const button = screen.getByRole("button", { name: /aggiungi nota/i });
    expect(button).not.toBeDisabled();
  });

  it("renders empty state when no entries", () => {
    render(<TimelineFeed dealId="00000000-0000-0000-0000-000000000001" entries={[]} />);
    expect(screen.getByText(/nessuna attività/i)).toBeInTheDocument();
  });
});
