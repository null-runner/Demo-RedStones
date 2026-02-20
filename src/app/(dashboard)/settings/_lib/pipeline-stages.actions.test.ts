import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

vi.mock("@/lib/auth", () => ({
  requireRole: vi.fn(),
  RBACError: class RBACError extends Error {
    readonly statusCode = 403;
    constructor(message = "Azione non consentita per il tuo ruolo") {
      super(message);
      this.name = "RBACError";
    }
  },
}));

vi.mock("./pipeline-stages.service", () => ({
  pipelineStagesService: {
    create: vi.fn(),
    rename: vi.fn(),
    reorder: vi.fn(),
    delete: vi.fn(),
  },
}));

import { createStage, deleteStage, renameStage, reorderStages } from "./pipeline-stages.actions";
import { pipelineStagesService } from "./pipeline-stages.service";

import { requireRole, RBACError } from "@/lib/auth";

const mockRequireRole = vi.mocked(requireRole);

beforeEach(() => {
  vi.clearAllMocks();
  // Default: admin allowed
  mockRequireRole.mockResolvedValue(undefined);
});

describe("createStage — RBAC", () => {
  it("returns RBAC error when member calls createStage", async () => {
    mockRequireRole.mockRejectedValue(new RBACError("Azione non consentita per il tuo ruolo"));
    const result = await createStage("Nuovo Stage");
    expect(result).toEqual({ success: false, error: "Azione non consentita per il tuo ruolo" });
    expect(pipelineStagesService.create).not.toHaveBeenCalled();
  });

  it("proceeds normally when admin calls createStage", async () => {
    const mockStage = {
      id: "ps1",
      name: "Nuovo Stage",
      sortOrder: 2,
      isProtected: false,
      createdAt: new Date(),
    };
    vi.mocked(pipelineStagesService.create).mockResolvedValue(mockStage);
    const result = await createStage("Nuovo Stage");
    expect(result).toEqual({ success: true, data: mockStage });
    expect(pipelineStagesService.create).toHaveBeenCalledWith("Nuovo Stage");
  });
});

describe("renameStage — RBAC", () => {
  it("returns RBAC error when non-admin calls renameStage", async () => {
    mockRequireRole.mockRejectedValue(new RBACError());
    const result = await renameStage("550e8400-e29b-41d4-a716-446655440000", "Nuovo");
    expect(result).toEqual({ success: false, error: "Azione non consentita per il tuo ruolo" });
    expect(pipelineStagesService.rename).not.toHaveBeenCalled();
  });
});

describe("reorderStages — RBAC", () => {
  it("returns RBAC error when non-admin calls reorderStages", async () => {
    mockRequireRole.mockRejectedValue(new RBACError());
    const result = await reorderStages(["550e8400-e29b-41d4-a716-446655440000"]);
    expect(result).toEqual({ success: false, error: "Azione non consentita per il tuo ruolo" });
    expect(pipelineStagesService.reorder).not.toHaveBeenCalled();
  });
});

describe("deleteStage — RBAC", () => {
  it("returns RBAC error when non-admin calls deleteStage", async () => {
    mockRequireRole.mockRejectedValue(new RBACError());
    const result = await deleteStage("550e8400-e29b-41d4-a716-446655440000");
    expect(result).toEqual({ success: false, error: "Azione non consentita per il tuo ruolo" });
    expect(pipelineStagesService.delete).not.toHaveBeenCalled();
  });
});
