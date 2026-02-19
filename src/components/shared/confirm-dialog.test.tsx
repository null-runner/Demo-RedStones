import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ConfirmDialog } from "./confirm-dialog";

describe("ConfirmDialog", () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    title: "Elimina contatto",
    description: "Questa azione non può essere annullata.",
  };

  it("renders title and description when open", () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByText("Elimina contatto")).toBeInTheDocument();
    expect(screen.getByText("Questa azione non può essere annullata.")).toBeInTheDocument();
  });

  it("renders Annulla button", () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByRole("button", { name: "Annulla" })).toBeInTheDocument();
  });

  it("renders destructive confirm button", () => {
    render(<ConfirmDialog {...defaultProps} />);
    const btn = screen.getByRole("button", { name: "Elimina" });
    expect(btn).toBeInTheDocument();
    expect(btn.className).toMatch(/destructive/);
  });

  it("calls onClose when Annulla is clicked", async () => {
    const onClose = vi.fn();
    render(<ConfirmDialog {...defaultProps} onClose={onClose} />);
    await userEvent.click(screen.getByRole("button", { name: "Annulla" }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("calls onConfirm when confirm button is clicked", async () => {
    const onConfirm = vi.fn();
    render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />);
    await userEvent.click(screen.getByRole("button", { name: "Elimina" }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("renders custom confirmLabel when provided", () => {
    render(<ConfirmDialog {...defaultProps} confirmLabel="Rimuovi" />);
    expect(screen.getByRole("button", { name: "Rimuovi" })).toBeInTheDocument();
  });
});
