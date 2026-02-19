import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { ContactWithDetails } from "../../_lib/contacts.service";
import { ContactDetail } from "./contact-detail";

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

describe("ContactDetail", () => {
  it("renders personal info section: name, email, phone, role", () => {
    render(<ContactDetail contact={mockContact} />);

    expect(screen.getByText("Mario Rossi")).toBeInTheDocument();
    expect(screen.getByText("mario@example.com")).toBeInTheDocument();
    expect(screen.getByText("+39 02 1234567")).toBeInTheDocument();
    expect(screen.getByText("CEO")).toBeInTheDocument();
  });

  it("renders company section with company name", () => {
    render(<ContactDetail contact={mockContact} />);

    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
  });

  it("renders deals section with deal cards", () => {
    render(<ContactDetail contact={mockContact} />);

    expect(screen.getByText("Deal Alpha")).toBeInTheDocument();
    expect(screen.getByText("proposal")).toBeInTheDocument();
  });

  it("renders empty state for deals when no deals", () => {
    render(<ContactDetail contact={{ ...mockContact, deals: [] }} />);

    expect(screen.getByText("Nessun deal associato")).toBeInTheDocument();
  });

  it("renders recent activity section", () => {
    render(<ContactDetail contact={mockContact} />);

    expect(screen.getByText("Chiamata effettuata")).toBeInTheDocument();
  });

  it("renders tags as badges", () => {
    render(<ContactDetail contact={mockContact} />);

    expect(screen.getByText("sales")).toBeInTheDocument();
  });

  it("renders empty state for tags when no tags", () => {
    render(<ContactDetail contact={{ ...mockContact, tags: [] }} />);

    expect(screen.getByText("Nessun tag")).toBeInTheDocument();
  });

  it("renders back link to /contacts", () => {
    render(<ContactDetail contact={mockContact} />);

    const link = screen.getByRole("link", { name: /torna ai contatti/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/contacts");
  });
});
