import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { PipelineStageList } from "./pipeline-stage-list";

import type { PipelineStageRow } from "@/server/db/schema";

vi.mock("../_lib/pipeline-stages.actions", () => ({
  createStage: vi.fn().mockResolvedValue({ success: true, data: {} }),
  renameStage: vi.fn().mockResolvedValue({ success: true, data: {} }),
  deleteStage: vi.fn().mockResolvedValue({ success: true, data: {} }),
  reorderStages: vi.fn().mockResolvedValue({ success: true, data: undefined }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

const mockStages: PipelineStageRow[] = [
  { id: "ps1", name: "Lead", sortOrder: 1, isProtected: false, createdAt: new Date() },
  { id: "ps2", name: "Qualificato", sortOrder: 2, isProtected: false, createdAt: new Date() },
  { id: "ps6", name: "Chiuso Vinto", sortOrder: 6, isProtected: true, createdAt: new Date() },
  { id: "ps7", name: "Chiuso Perso", sortOrder: 7, isProtected: true, createdAt: new Date() },
];

describe("PipelineStageList", () => {
  it("renders all stage names", () => {
    render(<PipelineStageList stages={mockStages} />);
    expect(screen.getByText("Lead")).toBeInTheDocument();
    expect(screen.getByText("Qualificato")).toBeInTheDocument();
    expect(screen.getByText("Chiuso Vinto")).toBeInTheDocument();
    expect(screen.getByText("Chiuso Perso")).toBeInTheDocument();
  });

  it("protected stages do not have rename or delete buttons", () => {
    render(<PipelineStageList stages={mockStages} />);
    // Conta pulsanti delete: solo 2 (Lead e Qualificato), non Chiuso Vinto/Perso
    const deleteButtons = screen.getAllByRole("button", { name: /elimina/i });
    expect(deleteButtons).toHaveLength(2);
  });

  it("shows add stage button", () => {
    render(<PipelineStageList stages={mockStages} />);
    expect(screen.getByRole("button", { name: /aggiungi stage/i })).toBeInTheDocument();
  });

  it("shows rename input when rename button clicked", async () => {
    const user = userEvent.setup();
    render(<PipelineStageList stages={mockStages} />);
    const renameButtons = screen.getAllByRole("button", { name: /rinomina/i });
    const [firstRenameBtn] = renameButtons;
    if (!firstRenameBtn) throw new Error("No rename button found");
    await user.click(firstRenameBtn);
    expect(screen.getByDisplayValue("Lead")).toBeInTheDocument();
  });

  it("renders empty state when no non-protected stages", () => {
    const protectedOnly: PipelineStageRow[] = [
      { id: "ps6", name: "Chiuso Vinto", sortOrder: 6, isProtected: true, createdAt: new Date() },
    ];
    render(<PipelineStageList stages={protectedOnly} />);
    expect(screen.getByText(/nessuno stage/i)).toBeInTheDocument();
  });
});
