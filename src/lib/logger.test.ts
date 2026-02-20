import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { logger } from "./logger";

describe("logger", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("logs info with module prefix and timestamp", () => {
    logger.info("auth", "User logged in");
    expect(console.log).toHaveBeenCalledTimes(1);
    const msg = vi.mocked(console.log).mock.calls[0]?.[0] as string;
    expect(msg).toContain("[auth]");
    expect(msg).toContain("User logged in");
    expect(msg).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("logs warn with module prefix", () => {
    logger.warn("enrichment", "API key missing");
    expect(console.warn).toHaveBeenCalledTimes(1);
    const msg = vi.mocked(console.warn).mock.calls[0]?.[0] as string;
    expect(msg).toContain("[enrichment]");
    expect(msg).toContain("API key missing");
  });

  it("logs error with module prefix and error object", () => {
    const err = new Error("connection failed");
    logger.error("db", "Query failed", err);
    expect(console.error).toHaveBeenCalledTimes(1);
    const msg = vi.mocked(console.error).mock.calls[0]?.[0] as string;
    expect(msg).toContain("[db]");
    expect(msg).toContain("Query failed");
    expect(console.error).toHaveBeenCalledWith(msg, err);
  });

  it("logs error without error object", () => {
    logger.error("deals", "Not found");
    expect(console.error).toHaveBeenCalledTimes(1);
    const msg = vi.mocked(console.error).mock.calls[0]?.[0] as string;
    expect(msg).toContain("[deals]");
    expect(msg).toContain("Not found");
  });
});
