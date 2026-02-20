import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { signIn } from "next-auth/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next-auth/react", () => ({
  signIn: vi.fn(),
  useSession: vi.fn(() => ({ data: null, status: "unauthenticated" })),
}));

const mockRouterPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockRouterPush }),
  useSearchParams: () => ({ get: () => null }),
}));

import { SignInForm } from "./sign-in-form";

describe("SignInForm", () => {
  it("renders email and password fields", () => {
    render(<SignInForm />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it("password field has type password (not visible in clear)", () => {
    render(<SignInForm />);
    const passwordInput = screen.getByLabelText(/password/i);
    expect(passwordInput).toHaveAttribute("type", "password");
  });

  it("shows inline error message on invalid credentials", async () => {
    const user = userEvent.setup();
    const mockSignIn = vi.mocked(signIn);
    mockSignIn.mockResolvedValueOnce({
      error: "CredentialsSignin",
      ok: false,
      status: 401,
      url: null,
    } as never);

    render(<SignInForm />);

    await user.type(screen.getByLabelText(/email/i), "wrong@example.com");
    await user.type(screen.getByLabelText(/password/i), "wrongpassword");
    await user.click(screen.getByRole("button", { name: /accedi/i }));

    await waitFor(() => {
      expect(screen.getByText(/credenziali non valide/i)).toBeInTheDocument();
    });
  });

  it("URL stays on sign-in page after error (no redirect)", async () => {
    const user = userEvent.setup();
    const mockSignIn = vi.mocked(signIn);
    mockSignIn.mockResolvedValueOnce({
      error: "CredentialsSignin",
      ok: false,
      status: 401,
      url: null,
    } as never);

    render(<SignInForm />);

    await user.type(screen.getByLabelText(/email/i), "bad@example.com");
    await user.type(screen.getByLabelText(/password/i), "badpass");
    await user.click(screen.getByRole("button", { name: /accedi/i }));

    await waitFor(() => {
      expect(screen.getByText(/credenziali non valide/i)).toBeInTheDocument();
    });

    // signIn was called with redirect: false
    expect(mockSignIn).toHaveBeenCalledWith(
      "credentials",
      expect.objectContaining({ redirect: false }),
    );
  });

  it("renders link to sign-up page", () => {
    render(<SignInForm />);
    const link = screen.getByRole("link", { name: /registrati/i });
    expect(link).toHaveAttribute("href", "/sign-up");
  });

  it("renders Esplora in Demo Mode button", () => {
    render(<SignInForm />);
    expect(screen.getByRole("button", { name: /esplora in demo mode/i })).toBeInTheDocument();
  });

  it("shows loading text while demo is loading", async () => {
    const user = userEvent.setup();
    // fetch returns a pending promise to simulate loading
    const fetchSpy = vi
      .spyOn(global, "fetch")
      .mockImplementationOnce(() => new Promise(() => undefined));

    render(<SignInForm />);
    await user.click(screen.getByRole("button", { name: /esplora in demo mode/i }));

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /preparazione demo in corso/i }),
      ).toBeInTheDocument();
    });

    fetchSpy.mockRestore();
  });

  it("calls fetch then signIn on demo mode click and redirects to /", async () => {
    const user = userEvent.setup();
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    } as Response);
    vi.mocked(signIn).mockResolvedValueOnce(undefined as never);

    render(<SignInForm />);
    await user.click(screen.getByRole("button", { name: /esplora in demo mode/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/auth/guest", { method: "POST" });
      expect(signIn).toHaveBeenCalledWith(
        "credentials",
        expect.objectContaining({
          email: "guest@demo.redstones.local",
          password: "",
          redirect: false,
        }),
      );
      expect(mockRouterPush).toHaveBeenCalledWith("/");
    });
  });

  it("disables form inputs and submit button during demo loading", async () => {
    const user = userEvent.setup();
    vi.spyOn(global, "fetch").mockImplementationOnce(() => new Promise(() => undefined));

    render(<SignInForm />);
    await user.click(screen.getByRole("button", { name: /esplora in demo mode/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/email/i)).toBeDisabled();
      expect(screen.getByLabelText(/password/i)).toBeDisabled();
      expect(screen.getByRole("button", { name: /accedi/i })).toBeDisabled();
    });
  });

  it("shows error when fetch to /api/auth/guest fails", async () => {
    const user = userEvent.setup();
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ success: false }),
    } as Response);

    render(<SignInForm />);
    await user.click(screen.getByRole("button", { name: /esplora in demo mode/i }));

    await waitFor(() => {
      expect(screen.getByText(/errore durante la preparazione della demo/i)).toBeInTheDocument();
    });
  });

  it("shows error when signIn returns error during demo mode", async () => {
    const user = userEvent.setup();
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    } as Response);
    vi.mocked(signIn).mockResolvedValueOnce({
      error: "CredentialsSignin",
      ok: false,
      status: 401,
      url: null,
    } as never);

    render(<SignInForm />);
    await user.click(screen.getByRole("button", { name: /esplora in demo mode/i }));

    await waitFor(() => {
      expect(screen.getByText(/errore di autenticazione demo/i)).toBeInTheDocument();
    });
  });

  it("shows network error when fetch throws during demo mode", async () => {
    const user = userEvent.setup();
    vi.spyOn(global, "fetch").mockRejectedValueOnce(new Error("Network error"));

    render(<SignInForm />);
    await user.click(screen.getByRole("button", { name: /esplora in demo mode/i }));

    await waitFor(() => {
      expect(screen.getByText(/errore di rete/i)).toBeInTheDocument();
    });
  });
});
