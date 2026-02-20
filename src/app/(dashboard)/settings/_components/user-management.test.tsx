import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

import { UserManagement } from "./user-management";
import type { UserRow } from "../_lib/users.service";

const mockUsers: UserRow[] = [
  {
    id: "member-1",
    name: "Mario Rossi",
    email: "mario@test.com",
    role: "member",
    createdAt: new Date("2024-01-01"),
    invitedAt: null,
  },
  {
    id: "admin-1",
    name: "Admin User",
    email: "admin@test.com",
    role: "admin",
    createdAt: new Date("2024-01-02"),
    invitedAt: new Date("2024-01-02"),
  },
];

describe("UserManagement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("renders user table with correct columns", () => {
    render(<UserManagement initialUsers={mockUsers} currentUserId="admin-1" />);

    expect(screen.getByRole("columnheader", { name: "Nome" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Email" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Ruolo" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Data registrazione" })).toBeInTheDocument();
    expect(screen.getByText("Mario Rossi")).toBeInTheDocument();
    expect(screen.getByText("Admin User")).toBeInTheDocument();
  });

  it("shows Invitato badge for users with invitedAt set", () => {
    render(<UserManagement initialUsers={mockUsers} currentUserId="admin-1" />);

    expect(screen.getByText("Invitato")).toBeInTheDocument();
  });

  it("disables Remove button for current user with tooltip", () => {
    render(<UserManagement initialUsers={mockUsers} currentUserId="admin-1" />);

    const adminRow = screen.getByText("Admin User").closest("tr");
    if (!adminRow) throw new Error("adminRow not found");
    const deleteButton = within(adminRow).getByRole("button", { name: /rimuovi/i });
    expect(deleteButton).toBeDisabled();
    expect(deleteButton).toHaveAttribute("title", "Non puoi rimuovere il tuo account");
  });

  it("opens confirm dialog on Remove click for non-self user", async () => {
    const user = userEvent.setup();
    render(<UserManagement initialUsers={mockUsers} currentUserId="admin-1" />);

    const memberRow = screen.getByText("Mario Rossi").closest("tr");
    if (!memberRow) throw new Error("memberRow not found");
    const deleteButton = within(memberRow).getByRole("button", { name: /rimuovi/i });
    await user.click(deleteButton);

    expect(screen.getByText(/sei sicuro di voler rimuovere mario rossi/i)).toBeInTheDocument();
  });

  it("adds new user to table after successful invite", async () => {
    const user = userEvent.setup();
    const newUser = {
      id: "new-1",
      name: "newuser",
      email: "newuser@test.com",
      role: "member",
      createdAt: "2024-06-01T00:00:00.000Z",
      invitedAt: "2024-06-01T00:00:00.000Z",
    };
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      status: 201,
      json: () => Promise.resolve(newUser),
    } as Response);

    render(<UserManagement initialUsers={mockUsers} currentUserId="admin-1" />);

    const emailInput = screen.getByPlaceholderText("utente@esempio.com");
    await user.type(emailInput, "newuser@test.com");
    await user.click(screen.getByRole("button", { name: /invia invito/i }));

    await waitFor(() => {
      expect(screen.getByText("newuser")).toBeInTheDocument();
    });
  });

  it("shows error on invite with duplicate email (409)", async () => {
    const user = userEvent.setup();
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      status: 409,
      json: () => Promise.resolve({ error: "Email già registrata nel sistema" }),
    } as Response);

    render(<UserManagement initialUsers={mockUsers} currentUserId="admin-1" />);

    const emailInput = screen.getByPlaceholderText("utente@esempio.com");
    await user.type(emailInput, "mario@test.com");
    await user.click(screen.getByRole("button", { name: /invia invito/i }));

    await waitFor(() => {
      expect(screen.getByText("Email già registrata nel sistema")).toBeInTheDocument();
    });
  });

  it("removes user from list after confirmed deletion", async () => {
    const user = userEvent.setup();
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true }),
    } as Response);

    render(<UserManagement initialUsers={mockUsers} currentUserId="admin-1" />);

    const memberRow = screen.getByText("Mario Rossi").closest("tr");
    if (!memberRow) throw new Error("memberRow not found");
    const deleteButton = within(memberRow).getByRole("button", { name: /rimuovi/i });
    await user.click(deleteButton);

    const confirmButton = screen.getByRole("button", { name: /^rimuovi$/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(screen.queryByText("Mario Rossi")).not.toBeInTheDocument();
    });
  });
});
