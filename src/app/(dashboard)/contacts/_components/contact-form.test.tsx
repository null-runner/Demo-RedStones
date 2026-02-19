import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { ContactWithCompanyAndTags } from "../_lib/contacts.service";
import { ContactForm } from "./contact-form";

const mockCompanies = [
  { id: "00000000-0000-0000-0000-000000000010", name: "Acme Corp" },
  { id: "00000000-0000-0000-0000-000000000011", name: "Beta Srl" },
];

const mockAllTags = [{ id: "t1", name: "react" }];

const mockContact: ContactWithCompanyAndTags = {
  id: "00000000-0000-0000-0000-000000000001",
  firstName: "Mario",
  lastName: "Rossi",
  email: "mario@example.com",
  phone: "+39 02 1234567",
  role: "CEO",
  companyId: "00000000-0000-0000-0000-000000000010",
  companyName: "Acme Corp",
  tags: [],
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

describe("ContactForm", () => {
  it("renders all form fields", () => {
    render(
      <ContactForm
        companies={mockCompanies}
        allTags={mockAllTags}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Nome")).toBeInTheDocument();
    expect(screen.getByLabelText("Cognome")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Telefono")).toBeInTheDocument();
    expect(screen.getByLabelText("Ruolo")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Aggiungi tag...")).toBeInTheDocument();
  });

  it("renders pre-filled tags when initialData has tags", () => {
    const contactWithTags: ContactWithCompanyAndTags = {
      ...mockContact,
      tags: [{ id: "t1", name: "react" }],
    };
    render(
      <ContactForm
        initialData={contactWithTags}
        companies={mockCompanies}
        allTags={mockAllTags}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByText("react")).toBeInTheDocument();
  });

  it("shows email validation error for invalid email", async () => {
    const user = userEvent.setup();
    render(
      <ContactForm
        companies={mockCompanies}
        allTags={mockAllTags}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    await user.type(screen.getByLabelText("Nome"), "Mario");
    await user.type(screen.getByLabelText("Cognome"), "Rossi");
    await user.type(screen.getByLabelText("Email"), "invalid-email");
    await user.click(screen.getByRole("button", { name: /salva/i }));

    await waitFor(() => {
      expect(screen.getByText("Email non valida")).toBeInTheDocument();
    });
  });

  it("shows phone validation error for invalid phone", async () => {
    const user = userEvent.setup();
    render(
      <ContactForm
        companies={mockCompanies}
        allTags={mockAllTags}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    await user.type(screen.getByLabelText("Nome"), "Mario");
    await user.type(screen.getByLabelText("Cognome"), "Rossi");
    await user.type(screen.getByLabelText("Telefono"), "abc");
    await user.click(screen.getByRole("button", { name: /salva/i }));

    await waitFor(() => {
      expect(screen.getByText("Telefono non valido")).toBeInTheDocument();
    });
  });

  it("calls onSubmit with correct data for valid input", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(
      <ContactForm
        companies={mockCompanies}
        allTags={mockAllTags}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />,
    );

    await user.type(screen.getByLabelText("Nome"), "Mario");
    await user.type(screen.getByLabelText("Cognome"), "Rossi");
    await user.type(screen.getByLabelText("Email"), "mario@example.com");

    await user.click(screen.getByRole("button", { name: /salva/i }));

    await waitFor(
      () => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            firstName: "Mario",
            lastName: "Rossi",
            email: "mario@example.com",
          }),
          expect.anything(),
        );
      },
      { timeout: 3000 },
    );
  });

  it("pre-fills fields when initialData is provided", () => {
    render(
      <ContactForm
        initialData={mockContact}
        companies={mockCompanies}
        allTags={mockAllTags}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByLabelText<HTMLInputElement>("Nome").value).toBe("Mario");
    expect(screen.getByLabelText<HTMLInputElement>("Cognome").value).toBe("Rossi");
    expect(screen.getByLabelText<HTMLInputElement>("Email").value).toBe("mario@example.com");
  });

  it("shows loading state during submission", () => {
    render(
      <ContactForm
        companies={mockCompanies}
        allTags={mockAllTags}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        isLoading={true}
      />,
    );

    const saveButton = screen.getByRole("button", { name: /salva/i });
    expect(saveButton).toBeDisabled();
  });

  it("calls onCancel when Annulla is clicked", async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();
    render(
      <ContactForm
        companies={mockCompanies}
        allTags={mockAllTags}
        onSubmit={vi.fn()}
        onCancel={onCancel}
      />,
    );

    await user.click(screen.getByRole("button", { name: /annulla/i }));

    expect(onCancel).toHaveBeenCalledOnce();
  });
});
