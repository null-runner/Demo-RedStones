import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Users } from "lucide-react";
import { describe, expect, it, vi } from "vitest";

import { EmptyState } from "./empty-state";

describe("EmptyState", () => {
  it("renders title and description", () => {
    render(<EmptyState icon={Users} title="Nessun contatto" description="Aggiungi il primo" />);
    expect(screen.getByText("Nessun contatto")).toBeInTheDocument();
    expect(screen.getByText("Aggiungi il primo")).toBeInTheDocument();
  });

  it("renders CTA button when action is provided", () => {
    const onClick = vi.fn();
    render(
      <EmptyState icon={Users} title="T" description="D" action={{ label: "Crea", onClick }} />,
    );
    expect(screen.getByRole("button", { name: "Crea" })).toBeInTheDocument();
  });

  it("does not render button when no action is provided", () => {
    render(<EmptyState icon={Users} title="T" description="D" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("calls action onClick when button is clicked", async () => {
    const onClick = vi.fn();
    render(
      <EmptyState icon={Users} title="T" description="D" action={{ label: "Crea", onClick }} />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Crea" }));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
