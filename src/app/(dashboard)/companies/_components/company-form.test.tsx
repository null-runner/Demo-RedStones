import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { CompanyForm } from "./company-form";

const mockCompany = {
  id: "00000000-0000-0000-0000-000000000001",
  name: "RedStones Srl",
  domain: "redstones.it",
  sector: "SaaS",
  description: "Agenzia SaaS",
  enrichmentDescription: null,
  enrichmentSector: null,
  enrichmentSize: null,
  enrichmentPainPoints: null,
  enrichmentStatus: "not_enriched" as const,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

describe("CompanyForm", () => {
  it("renders form fields: nome, dominio, settore, descrizione", () => {
    render(<CompanyForm onSubmit={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByLabelText(/nome/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/dominio/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/settore/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/descrizione/i)).toBeInTheDocument();
  });

  it("shows required error when nome is empty on submit", async () => {
    const user = userEvent.setup();
    render(<CompanyForm onSubmit={vi.fn()} onCancel={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /crea azienda/i }));

    await waitFor(() => {
      expect(screen.getByText("Nome obbligatorio")).toBeInTheDocument();
    });
  });

  it("shows domain validation error for invalid domain", async () => {
    const user = userEvent.setup();
    render(<CompanyForm onSubmit={vi.fn()} onCancel={vi.fn()} />);

    await user.type(screen.getByLabelText(/nome/i), "Test");
    await user.type(screen.getByLabelText(/dominio/i), "http://invalid");
    await user.click(screen.getByRole("button", { name: /crea azienda/i }));

    await waitFor(() => {
      expect(screen.getByText("Dominio non valido")).toBeInTheDocument();
    });
  });

  it("accepts valid domain format", async () => {
    const user = userEvent.setup();
    render(<CompanyForm onSubmit={vi.fn().mockResolvedValue(undefined)} onCancel={vi.fn()} />);

    await user.type(screen.getByLabelText(/nome/i), "Test");
    await user.type(screen.getByLabelText(/dominio/i), "redstones.it");
    await user.click(screen.getByRole("button", { name: /crea azienda/i }));

    await waitFor(() => {
      expect(screen.queryByText("Dominio non valido")).not.toBeInTheDocument();
    });
  });

  it("accepts empty domain (optional field)", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<CompanyForm onSubmit={onSubmit} onCancel={vi.fn()} />);

    await user.type(screen.getByLabelText(/nome/i), "Test Company");
    await user.click(screen.getByRole("button", { name: /crea azienda/i }));

    await waitFor(() => {
      expect(screen.queryByText("Dominio non valido")).not.toBeInTheDocument();
      expect(onSubmit).toHaveBeenCalled();
    });
  });

  it("calls onSubmit with form data when valid", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<CompanyForm onSubmit={onSubmit} onCancel={vi.fn()} />);

    await user.type(screen.getByLabelText(/nome/i), "RedStones Srl");
    await user.type(screen.getByLabelText(/dominio/i), "redstones.it");
    await user.type(screen.getByLabelText(/settore/i), "SaaS");
    await user.click(screen.getByRole("button", { name: /crea azienda/i }));

    await waitFor(
      () => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            name: "RedStones Srl",
            domain: "redstones.it",
            sector: "SaaS",
          }),
          expect.anything(),
        );
      },
      { timeout: 3000 },
    );
  });

  it("calls onCancel when Annulla button clicked", async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();
    render(<CompanyForm onSubmit={vi.fn()} onCancel={onCancel} />);

    await user.click(screen.getByRole("button", { name: /annulla/i }));

    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("shows loading state on submit button when isLoading=true", () => {
    render(<CompanyForm onSubmit={vi.fn()} onCancel={vi.fn()} isLoading={true} />);

    const submitButton = screen.getByRole("button", { name: /salvataggio/i });
    expect(submitButton).toBeDisabled();
  });

  it("populates fields when initialData provided (edit mode)", () => {
    render(<CompanyForm initialData={mockCompany} onSubmit={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByLabelText<HTMLInputElement>(/nome/i).value).toBe("RedStones Srl");
    expect(screen.getByLabelText<HTMLInputElement>(/dominio/i).value).toBe("redstones.it");
    expect(screen.getByLabelText<HTMLInputElement>(/settore/i).value).toBe("SaaS");
  });
});
