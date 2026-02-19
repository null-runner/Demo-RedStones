import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PageHeader } from "./page-header";

describe("PageHeader", () => {
  it("renders title as heading", () => {
    render(<PageHeader title="Contatti" />);
    expect(screen.getByRole("heading", { level: 1, name: "Contatti" })).toBeInTheDocument();
  });

  it("renders description when provided", () => {
    render(<PageHeader title="Contatti" description="Gestisci i contatti" />);
    expect(screen.getByText("Gestisci i contatti")).toBeInTheDocument();
  });

  it("renders action slot when provided", () => {
    render(<PageHeader title="T" action={<button>Nuovo</button>} />);
    expect(screen.getByRole("button", { name: "Nuovo" })).toBeInTheDocument();
  });

  it("renders children (filter area) when provided", () => {
    render(
      <PageHeader title="T">
        <span>filtri qui</span>
      </PageHeader>,
    );
    expect(screen.getByText("filtri qui")).toBeInTheDocument();
  });

  it("does not render description when not provided", () => {
    render(<PageHeader title="T" />);
    expect(screen.queryByText(/gestisci/i)).not.toBeInTheDocument();
  });
});
