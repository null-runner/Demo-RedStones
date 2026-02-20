import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { ContactWithDetails } from "../../_lib/contacts.service";
import { ContactDetail } from "./contact-detail";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/hooks/use-permission", () => ({
  usePermission: () => true,
}));

vi.mock("../../_lib/contacts.actions", () => ({
  syncContactTags: vi.fn(),
}));

const mockCompanies = [{ id: "00000000-0000-0000-0000-000000000010", name: "Acme Corp" }];

const mockTags = [
  { id: "t1", name: "sales" },
  { id: "t2", name: "priority" },
];

const mockContact: ContactWithDetails = {
  id: "00000000-0000-0000-0000-000000000001",
  firstName: "Mario",
  lastName: "Rossi",
  email: "mario@example.com",
  phone: "+39 02 1234567",
  role: "CEO",
  companyId: "00000000-0000-0000-0000-000000000010",
  companyName: "Acme Corp",
  companyDomain: "acme.com",
  tags: [{ id: "t1", name: "sales" }],
  deals: [
    {
      id: "d1",
      title: "Deal Alpha",
      value: "5000.00",
      stage: "proposal",
      createdAt: new Date("2024-01-01"),
    },
  ],
  recentActivity: [
    {
      id: "te1",
      type: "note",
      content: "Chiamata effettuata",
      newStage: null,
      createdAt: new Date("2024-06-01"),
    },
  ],
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

function renderDetail(overrides?: Partial<ContactWithDetails>) {
  const contact = overrides ? { ...mockContact, ...overrides } : mockContact;
  return render(<ContactDetail contact={contact} companies={mockCompanies} allTags={mockTags} />);
}

describe("ContactDetail", () => {
  it("renders personal info section: name, email, phone, role", () => {
    renderDetail();

    expect(screen.getByText("Mario Rossi")).toBeInTheDocument();
    expect(screen.getByText("mario@example.com")).toBeInTheDocument();
    expect(screen.getByText("+39 02 1234567")).toBeInTheDocument();
    expect(screen.getByText("CEO")).toBeInTheDocument();
  });

  it("renders company section with company name", () => {
    renderDetail();

    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
  });

  it("renders deals section with deal cards", () => {
    renderDetail();

    expect(screen.getByText("Deal Alpha")).toBeInTheDocument();
    expect(screen.getByText("proposal")).toBeInTheDocument();
  });

  it("renders empty state for deals when no deals", () => {
    renderDetail({ deals: [] });

    expect(screen.getByText("Nessun deal associato")).toBeInTheDocument();
  });

  it("renders recent activity section", () => {
    renderDetail();

    expect(screen.getByText("Chiamata effettuata")).toBeInTheDocument();
  });

  it("renders tag input with existing tags", () => {
    renderDetail();

    expect(screen.getByText("sales")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Aggiungi tag...")).toBeInTheDocument();
  });

  it("renders back link to /contacts", () => {
    renderDetail();

    const link = screen.getByRole("link", { name: /torna ai contatti/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/contacts");
  });

  it("renders edit button", () => {
    renderDetail();

    expect(screen.getByRole("button", { name: /modifica/i })).toBeInTheDocument();
  });

  it("renders deals as links to deal detail", () => {
    renderDetail();

    const dealLink = screen.getByRole("link", { name: /deal alpha/i });
    expect(dealLink).toHaveAttribute("href", "/deals/d1");
  });
});
