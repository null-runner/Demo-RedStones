import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { ContactWithCompany } from "../_lib/contacts.service";
import { ContactTable } from "./contact-table";

const mockContacts: ContactWithCompany[] = [
  {
    id: "00000000-0000-0000-0000-000000000001",
    firstName: "Mario",
    lastName: "Rossi",
    email: "mario@example.com",
    phone: "+39 02 1234567",
    role: "CEO",
    companyId: "00000000-0000-0000-0000-000000000010",
    companyName: "Acme Corp",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "00000000-0000-0000-0000-000000000002",
    firstName: "Luigi",
    lastName: "Bianchi",
    email: "luigi@example.com",
    phone: null,
    role: "CTO",
    companyId: null,
    companyName: null,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "00000000-0000-0000-0000-000000000003",
    firstName: "Anna",
    lastName: "Verdi",
    email: "anna@example.com",
    phone: null,
    role: null,
    companyId: null,
    companyName: "Beta Srl",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
];

describe("ContactTable", () => {
  it("renders column headers: Nome, Email, Azienda, Ruolo", () => {
    render(<ContactTable contacts={mockContacts} onEdit={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByText("Nome")).toBeInTheDocument();
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("Azienda")).toBeInTheDocument();
    expect(screen.getByText("Ruolo")).toBeInTheDocument();
  });

  it("renders contact rows with correct data", () => {
    render(<ContactTable contacts={mockContacts} onEdit={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByText("mario@example.com")).toBeInTheDocument();
    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    expect(screen.getByText("CEO")).toBeInTheDocument();
  });

  it("renders empty state when contacts is empty", () => {
    render(<ContactTable contacts={[]} onEdit={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByText("Nessun contatto")).toBeInTheDocument();
  });

  it("displays full name as firstName + lastName", () => {
    render(<ContactTable contacts={mockContacts} onEdit={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByText("Mario Rossi")).toBeInTheDocument();
  });

  it("calls onEdit when edit button is clicked", async () => {
    const onEdit = vi.fn();
    const user = userEvent.setup();
    render(<ContactTable contacts={mockContacts} onEdit={onEdit} onDelete={vi.fn()} />);

    const editButtons = screen.getAllByRole("button", { name: /modifica/i });
    const editButton = editButtons.at(0);
    expect(editButton).toBeDefined();
    await user.click(editButton as HTMLElement);

    expect(onEdit).toHaveBeenCalledWith(mockContacts[0]);
  });

  it("calls onDelete when delete button is clicked", async () => {
    const onDelete = vi.fn();
    const user = userEvent.setup();
    render(<ContactTable contacts={mockContacts} onEdit={vi.fn()} onDelete={onDelete} />);

    const deleteButtons = screen.getAllByRole("button", { name: /elimina/i });
    const deleteButton = deleteButtons.at(0);
    expect(deleteButton).toBeDefined();
    await user.click(deleteButton as HTMLElement);

    const firstContact = mockContacts.at(0);
    expect(firstContact).toBeDefined();
    expect(onDelete).toHaveBeenCalledWith((firstContact as (typeof mockContacts)[number]).id);
  });
});
