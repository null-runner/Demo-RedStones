import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { type Column, DataTable } from "./data-table";

type Person = {
  id: string;
  name: string;
  email: string;
};

const columns: Column<Person>[] = [
  { key: "name", header: "Nome" },
  { key: "email", header: "Email" },
];

const data: Person[] = [
  { id: "1", name: "Alice", email: "alice@example.com" },
  { id: "2", name: "Bob", email: "bob@example.com" },
  { id: "3", name: "Carlo", email: "carlo@example.com" },
];

describe("DataTable", () => {
  it("renders column headers", () => {
    render(<DataTable columns={columns} data={data} keyExtractor={(p) => p.id} />);
    expect(screen.getByText("Nome")).toBeInTheDocument();
    expect(screen.getByText("Email")).toBeInTheDocument();
  });

  it("renders row data", () => {
    render(<DataTable columns={columns} data={data} keyExtractor={(p) => p.id} />);
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("bob@example.com")).toBeInTheDocument();
  });

  it("renders empty state when data is empty", () => {
    render(<DataTable columns={columns} data={[]} keyExtractor={(p) => p.id} />);
    expect(screen.getByText("Nessun risultato")).toBeInTheDocument();
  });

  it("renders correct number of rows", () => {
    render(<DataTable columns={columns} data={data} keyExtractor={(p) => p.id} />);
    const rows = screen.getAllByRole("row");
    // 1 header row + 3 data rows = 4
    expect(rows).toHaveLength(4);
  });
});
