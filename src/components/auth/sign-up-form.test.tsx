import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

// Mock the server action
vi.mock("@/app/(auth)/sign-up/_lib/sign-up.actions", () => ({
  registerUser: vi.fn(),
}));

import { SignUpForm } from "./sign-up-form";

import { registerUser } from "@/app/(auth)/sign-up/_lib/sign-up.actions";

describe("SignUpForm", () => {
  it("renders name, email and password fields", () => {
    render(<SignUpForm />);
    expect(screen.getByLabelText(/nome/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it("password field has type password (not visible in clear)", () => {
    render(<SignUpForm />);
    const passwordInput = screen.getByLabelText(/password/i);
    expect(passwordInput).toHaveAttribute("type", "password");
  });

  it("shows inline error when email is already registered", async () => {
    const user = userEvent.setup();
    const mockRegister = vi.mocked(registerUser);
    mockRegister.mockResolvedValueOnce({ error: "Email già registrata" });

    render(<SignUpForm />);

    await user.type(screen.getByLabelText(/nome/i), "Test User");
    await user.type(screen.getByLabelText(/email/i), "existing@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /crea account/i }));

    await waitFor(() => {
      expect(screen.getByText(/email già registrata/i)).toBeInTheDocument();
    });
  });

  it("shows validation error when password is too short", async () => {
    const user = userEvent.setup();

    render(<SignUpForm />);

    await user.type(screen.getByLabelText(/nome/i), "Test User");
    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "short");
    await user.click(screen.getByRole("button", { name: /crea account/i }));

    await waitFor(() => {
      expect(screen.getByText(/almeno 8 caratteri/i)).toBeInTheDocument();
    });
  });

  it("renders link to sign-in page", () => {
    render(<SignUpForm />);
    const link = screen.getByRole("link", { name: /accedi/i });
    expect(link).toHaveAttribute("href", "/sign-in");
  });
});
