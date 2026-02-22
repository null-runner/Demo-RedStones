import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { DealForm } from "./deal-form";

import type { Deal } from "@/server/db/schema";

const mockCompanies = [
  { id: "c1", name: "RedStones Srl" },
  { id: "c2", name: "Acme Corp" },
];
const mockContacts = [
  { id: "ct1", firstName: "Mario", lastName: "Rossi", companyId: "c1" },
  { id: "ct2", firstName: "Luigi", lastName: "Verdi", companyId: "c2" },
  { id: "ct3", firstName: "Anna", lastName: "Bianchi", companyId: null },
];
const mockUsers = [{ id: "u1", name: "Admin User" }];

const mockDeal: Deal = {
  id: "00000000-0000-0000-0000-000000000001",
  title: "Deal Test",
  value: "5000.00",
  stage: "Proposta",
  contactId: null,
  companyId: null,
  ownerId: null,
  lostReason: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("DealForm", () => {
  it("renders all required fields: title, value, stage", () => {
    render(
      <DealForm
        companies={mockCompanies}
        contacts={mockContacts}
        users={mockUsers}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByText("Titolo *")).toBeInTheDocument();
    expect(screen.getByText("Valore (EUR) *")).toBeInTheDocument();
    expect(screen.getByText("Stage *")).toBeInTheDocument();
  });

  it("renders optional fields: contatto, azienda, owner", () => {
    render(
      <DealForm
        companies={mockCompanies}
        contacts={mockContacts}
        users={mockUsers}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByText("Contatto")).toBeInTheDocument();
    expect(screen.getByText("Azienda")).toBeInTheDocument();
    expect(screen.getByText("Owner")).toBeInTheDocument();
  });

  it("shows validation error when title is empty", async () => {
    const user = userEvent.setup();
    render(
      <DealForm
        companies={mockCompanies}
        contacts={mockContacts}
        users={mockUsers}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: /crea deal/i }));

    await waitFor(() => {
      expect(screen.getByText("Titolo obbligatorio")).toBeInTheDocument();
    });
  });

  it("shows validation error for invalid value", async () => {
    const user = userEvent.setup();
    render(
      <DealForm
        companies={mockCompanies}
        contacts={mockContacts}
        users={mockUsers}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    const titleInput = screen.getByPlaceholderText(/crm custom/i);
    await user.type(titleInput, "Test Deal");

    // jsdom <input type="number"> doesn't support typing negative values.
    // Clearing produces NaN → coerce.number() triggers "Il valore deve essere >= 0"
    const valueInput = screen.getByRole("spinbutton");
    await user.clear(valueInput);

    await user.click(screen.getByRole("button", { name: /crea deal/i }));

    await waitFor(() => {
      expect(screen.getByText("Il valore deve essere >= 0")).toBeInTheDocument();
    });
  });

  it("accepts value of zero", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(
      <DealForm
        companies={mockCompanies}
        contacts={mockContacts}
        users={mockUsers}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />,
    );

    const titleInput = screen.getByPlaceholderText(/crm custom/i);
    await user.type(titleInput, "Test");

    // Default value is already 0 — just submit to verify onSubmit receives value: 0
    await user.click(screen.getByRole("button", { name: /crea deal/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ value: 0 }));
    });
  });

  it("pre-fills form in edit mode", () => {
    render(
      <DealForm
        initialData={mockDeal}
        companies={mockCompanies}
        contacts={mockContacts}
        users={mockUsers}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByDisplayValue("Deal Test")).toBeInTheDocument();
  });

  it("shows lostReason and notes fields when stage is Chiuso Perso", () => {
    const lostDeal: Deal = { ...mockDeal, stage: "Chiuso Perso", lostReason: "Prezzo troppo alto" };
    render(
      <DealForm
        initialData={lostDeal}
        companies={mockCompanies}
        contacts={mockContacts}
        users={mockUsers}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByText(/Motivo perdita/)).toBeInTheDocument();
    expect(screen.getByText(/Note \(opzionale\)/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Aggiungi dettagli...")).toBeInTheDocument();
  });

  it("does not show lostReason fields for non-lost stages", () => {
    render(
      <DealForm
        initialData={mockDeal}
        companies={mockCompanies}
        contacts={mockContacts}
        users={mockUsers}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.queryByText(/Motivo perdita/)).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Aggiungi dettagli...")).not.toBeInTheDocument();
  });

  it("shows validation error when submitting Chiuso Perso without reason", async () => {
    const user = userEvent.setup();
    const lostDeal: Deal = { ...mockDeal, stage: "Chiuso Perso", lostReason: null };
    render(
      <DealForm
        initialData={lostDeal}
        companies={mockCompanies}
        contacts={mockContacts}
        users={mockUsers}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: /aggiorna deal/i }));

    await waitFor(() => {
      expect(screen.getByText("Seleziona un motivo di perdita")).toBeInTheDocument();
    });
  });

  it("calls onCancel when cancel button clicked", async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();
    render(
      <DealForm
        companies={mockCompanies}
        contacts={mockContacts}
        users={mockUsers}
        onSubmit={vi.fn()}
        onCancel={onCancel}
      />,
    );

    await user.click(screen.getByRole("button", { name: /annulla/i }));

    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("auto-selects company when selecting a contact with companyId", async () => {
    const user = userEvent.setup();
    render(
      <DealForm
        companies={mockCompanies}
        contacts={mockContacts}
        users={mockUsers}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    // Open contact select and choose Mario Rossi (companyId: c1)
    // Selects order: stage[0], contactId[1], companyId[2], ownerId[3]
    const comboboxes = screen.getAllByRole("combobox");
    expect(comboboxes).toHaveLength(4);
    const [, contactSelect, companySelect] = comboboxes;

    await user.click(contactSelect as HTMLElement);
    await user.click(screen.getByRole("option", { name: "Mario Rossi" }));

    // Company combobox should auto-fill to RedStones Srl
    await waitFor(() => {
      expect(companySelect).toHaveTextContent("RedStones Srl");
    });
  });

  it("filters contacts when company is selected", async () => {
    const user = userEvent.setup();
    render(
      <DealForm
        companies={mockCompanies}
        contacts={mockContacts}
        users={mockUsers}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    // Select Acme Corp first (combobox[2] = companyId)
    const boxes = screen.getAllByRole("combobox");
    expect(boxes).toHaveLength(4);
    const [, contactBox, companyBox] = boxes;

    await user.click(companyBox as HTMLElement);
    await user.click(screen.getByRole("option", { name: "Acme Corp" }));

    // Open contact dropdown — should show Luigi (Acme) and Anna (no company), but not Mario (RedStones)
    await user.click(contactBox as HTMLElement);

    expect(screen.getByRole("option", { name: "Luigi Verdi" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Anna Bianchi" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Mario Rossi" })).not.toBeInTheDocument();
  });

  it("clears contact when switching to incompatible company", async () => {
    const user = userEvent.setup();
    // Start with Mario Rossi (c1) and RedStones (c1)
    const dealWithContact: Deal = {
      ...mockDeal,
      contactId: "ct1",
      companyId: "c1",
    };
    render(
      <DealForm
        initialData={dealWithContact}
        companies={mockCompanies}
        contacts={mockContacts}
        users={mockUsers}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    // Switch company to Acme Corp (c2) — Mario is from RedStones (c1), should be cleared
    const editBoxes = screen.getAllByRole("combobox");
    expect(editBoxes).toHaveLength(4);
    const [, editContactBox, editCompanyBox] = editBoxes;

    await user.click(editCompanyBox as HTMLElement);
    await user.click(screen.getByRole("option", { name: "Acme Corp" }));

    // Contact combobox should reset to "Nessun contatto" since Mario belongs to c1
    await waitFor(() => {
      expect(editContactBox).toHaveTextContent("Nessun contatto");
    });
  });
});
