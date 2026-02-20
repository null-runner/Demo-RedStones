import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useSession } from "next-auth/react";

import { usePermission } from "./use-permission";

vi.mock("next-auth/react", () => ({
  useSession: vi.fn(),
}));

type MockSessionReturn = {
  data: { user: { id: string; role: string; name: string; email: string }; expires: string } | null;
  status: string;
  update: ReturnType<typeof vi.fn>;
};

// Cast: useSession returns complex Session type; mock uses simpler shape for testing
const mockUseSession = vi.mocked(useSession) as unknown as {
  mockReturnValue: (v: MockSessionReturn) => void;
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("usePermission", () => {
  it("returns true for guest on delete:contacts (demo mode has full access)", () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: "1", role: "guest", name: "", email: "" }, expires: "" },
      status: "authenticated",
      update: vi.fn(),
    });
    const { result } = renderHook(() => usePermission("delete:contacts"));
    expect(result.current).toBe(true);
  });

  it("returns true for admin on delete:contacts", () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: "1", role: "admin", name: "", email: "" }, expires: "" },
      status: "authenticated",
      update: vi.fn(),
    });
    const { result } = renderHook(() => usePermission("delete:contacts"));
    expect(result.current).toBe(true);
  });

  it("returns true for member on delete:contacts", () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: "1", role: "member", name: "", email: "" }, expires: "" },
      status: "authenticated",
      update: vi.fn(),
    });
    const { result } = renderHook(() => usePermission("delete:contacts"));
    expect(result.current).toBe(true);
  });

  it("returns true for guest on manage:settings (demo mode has full access)", () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: "1", role: "guest", name: "", email: "" }, expires: "" },
      status: "authenticated",
      update: vi.fn(),
    });
    const { result } = renderHook(() => usePermission("manage:settings"));
    expect(result.current).toBe(true);
  });

  it("returns true for admin on manage:settings", () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: "1", role: "admin", name: "", email: "" }, expires: "" },
      status: "authenticated",
      update: vi.fn(),
    });
    const { result } = renderHook(() => usePermission("manage:settings"));
    expect(result.current).toBe(true);
  });

  it("returns false for member on manage:settings", () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: "1", role: "member", name: "", email: "" }, expires: "" },
      status: "authenticated",
      update: vi.fn(),
    });
    const { result } = renderHook(() => usePermission("manage:settings"));
    expect(result.current).toBe(false);
  });

  it("returns false when session is null (unauthenticated)", () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
      update: vi.fn(),
    });
    const { result } = renderHook(() => usePermission("delete:contacts"));
    expect(result.current).toBe(false);
  });
});
