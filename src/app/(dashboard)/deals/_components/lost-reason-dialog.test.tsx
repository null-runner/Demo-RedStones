import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { LostReasonDialog } from "./lost-reason-dialog";

const baseProps = {
  open: true,
  dealTitle: "CRM RedStones",
  onConfirm: vi.fn(),
  onCancel: vi.fn(),
};

describe("LostReasonDialog", () => {
  it("renders select and notes textarea when open", () => {
    render(<LostReasonDialog {...baseProps} />);

    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("shows deal title in dialog header", () => {
    render(<LostReasonDialog {...baseProps} />);

    expect(screen.getByText(/CRM RedStones/)).toBeInTheDocument();
  });

  it("shows error when confirming without selecting reason", async () => {
    const user = userEvent.setup();
    render(<LostReasonDialog {...baseProps} onConfirm={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /Conferma/i }));

    expect(screen.getByText("Seleziona un motivo di perdita")).toBeInTheDocument();
  });

  it("calls onConfirm with reason and notes when valid", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<LostReasonDialog {...baseProps} onConfirm={onConfirm} />);

    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: "Prezzo troppo alto" }));

    const textarea = screen.getByRole("textbox");
    await user.type(textarea, "note test");

    await user.click(screen.getByRole("button", { name: /Conferma/i }));

    expect(onConfirm).toHaveBeenCalledWith("Prezzo troppo alto", "note test");
  });

  it("calls onConfirm with null notes when notes empty", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<LostReasonDialog {...baseProps} onConfirm={onConfirm} />);

    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: "Prezzo troppo alto" }));

    await user.click(screen.getByRole("button", { name: /Conferma/i }));

    expect(onConfirm).toHaveBeenCalledWith("Prezzo troppo alto", null);
  });

  it("calls onCancel when Annulla clicked", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<LostReasonDialog {...baseProps} onCancel={onCancel} />);

    await user.click(screen.getByRole("button", { name: /Annulla/i }));

    expect(onCancel).toHaveBeenCalled();
  });

  it("resets state when dialog reopens", () => {
    const { rerender } = render(<LostReasonDialog {...baseProps} open={false} />);
    rerender(<LostReasonDialog {...baseProps} open={true} />);

    // No error visible after reopen
    expect(screen.queryByText("Seleziona un motivo di perdita")).not.toBeInTheDocument();
  });
});
