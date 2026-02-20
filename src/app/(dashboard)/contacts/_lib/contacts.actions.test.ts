import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("drizzle-orm", async (importOriginal) => {
  const actual = await importOriginal<typeof import("drizzle-orm")>();
  return { ...actual, eq: vi.fn() };
});

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

vi.mock("./contacts.service", () => ({
  contactsService: {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    addTagToContact: vi.fn(),
    removeTagFromContact: vi.fn(),
    getAllTags: vi.fn(),
    checkDuplicate: vi.fn(),
  },
}));

import { createContact, updateContact, deleteContact } from "./contacts.actions";
import { contactsService } from "./contacts.service";

import { requireRole, RBACError } from "@/lib/auth";

const mockRequireRole = vi.mocked(requireRole);

const validContactInput = {
  firstName: "Mario",
  lastName: "Rossi",
  email: "mario@example.com",
  phone: "",
  role: "",
  companyId: null,
  tagNames: [],
};

const mockContact = {
  id: "550e8400-e29b-41d4-a716-446655440001",
  firstName: "Mario",
  lastName: "Rossi",
  email: "mario@example.com",
  phone: null,
  role: null,
  companyId: null,
  linkedinUrl: null,
  notes: null,
  enrichmentStatus: "not_enriched" as const,
  enrichedData: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireRole.mockResolvedValue(undefined);
});

describe("createContact — RBAC", () => {
  it("returns RBAC error when guest calls createContact", async () => {
    mockRequireRole.mockRejectedValue(new RBACError());
    const result = await createContact(validContactInput);
    expect(result).toEqual({ success: false, error: "Azione non consentita per il tuo ruolo" });
    expect(contactsService.create).not.toHaveBeenCalled();
  });

  it("proceeds normally when admin calls createContact", async () => {
    vi.mocked(contactsService.create).mockResolvedValue(mockContact);
    vi.mocked(contactsService.addTagToContact).mockResolvedValue(undefined as never);
    const result = await createContact(validContactInput);
    expect(result.success).toBe(true);
    expect(contactsService.create).toHaveBeenCalledOnce();
  });
});

describe("deleteContact — RBAC", () => {
  it("returns RBAC error when guest calls deleteContact", async () => {
    mockRequireRole.mockRejectedValue(new RBACError());
    const result = await deleteContact("550e8400-e29b-41d4-a716-446655440001");
    expect(result).toEqual({ success: false, error: "Azione non consentita per il tuo ruolo" });
    expect(contactsService.delete).not.toHaveBeenCalled();
  });

  it("proceeds normally when admin calls deleteContact", async () => {
    vi.mocked(contactsService.delete).mockResolvedValue(undefined);
    const result = await deleteContact("550e8400-e29b-41d4-a716-446655440001");
    expect(result).toEqual({ success: true, data: undefined });
    expect(contactsService.delete).toHaveBeenCalledWith("550e8400-e29b-41d4-a716-446655440001");
  });
});

describe("updateContact — RBAC", () => {
  it("returns RBAC error when guest calls updateContact", async () => {
    mockRequireRole.mockRejectedValue(new RBACError());
    const result = await updateContact({
      id: "550e8400-e29b-41d4-a716-446655440001",
      ...validContactInput,
    });
    expect(result).toEqual({ success: false, error: "Azione non consentita per il tuo ruolo" });
    expect(contactsService.update).not.toHaveBeenCalled();
  });
});
