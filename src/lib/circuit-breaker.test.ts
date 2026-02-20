import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CircuitBreaker } from "./circuit-breaker";

describe("CircuitBreaker", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("executes the function when circuit is closed", async () => {
    const breaker = new CircuitBreaker({ failureThreshold: 3, resetTimeoutMs: 120_000 });
    const result = await breaker.execute(() => Promise.resolve("ok"));
    expect(result).toBe("ok");
  });

  it("opens after reaching failure threshold", async () => {
    const breaker = new CircuitBreaker({ failureThreshold: 3, resetTimeoutMs: 120_000 });
    const fail = () => Promise.reject(new Error("fail"));

    await expect(breaker.execute(fail)).rejects.toThrow("fail");
    await expect(breaker.execute(fail)).rejects.toThrow("fail");
    await expect(breaker.execute(fail)).rejects.toThrow("fail");

    await expect(breaker.execute(() => Promise.resolve("ok"))).rejects.toThrow(
      "Circuit breaker is open",
    );
  });

  it("rejects immediately when open", async () => {
    const breaker = new CircuitBreaker({ failureThreshold: 1, resetTimeoutMs: 120_000 });
    await expect(breaker.execute(() => Promise.reject(new Error("fail")))).rejects.toThrow("fail");

    const spy = vi.fn(() => Promise.resolve("ok"));
    await expect(breaker.execute(spy)).rejects.toThrow("Circuit breaker is open");
    expect(spy).not.toHaveBeenCalled();
  });

  it("transitions to half-open after reset timeout", async () => {
    const breaker = new CircuitBreaker({ failureThreshold: 1, resetTimeoutMs: 120_000 });
    await expect(breaker.execute(() => Promise.reject(new Error("fail")))).rejects.toThrow("fail");

    vi.advanceTimersByTime(120_000);

    const result = await breaker.execute(() => Promise.resolve("recovered"));
    expect(result).toBe("recovered");
  });

  it("re-opens if half-open probe fails", async () => {
    const breaker = new CircuitBreaker({ failureThreshold: 1, resetTimeoutMs: 120_000 });
    await expect(breaker.execute(() => Promise.reject(new Error("fail")))).rejects.toThrow("fail");

    vi.advanceTimersByTime(120_000);

    await expect(breaker.execute(() => Promise.reject(new Error("still broken")))).rejects.toThrow(
      "still broken",
    );

    await expect(breaker.execute(() => Promise.resolve("ok"))).rejects.toThrow(
      "Circuit breaker is open",
    );
  });

  it("closes after successful half-open probe", async () => {
    const breaker = new CircuitBreaker({ failureThreshold: 2, resetTimeoutMs: 120_000 });
    const fail = () => Promise.reject(new Error("fail"));

    await expect(breaker.execute(fail)).rejects.toThrow("fail");
    await expect(breaker.execute(fail)).rejects.toThrow("fail");

    vi.advanceTimersByTime(120_000);

    await breaker.execute(() => Promise.resolve("ok"));

    // Should be fully closed now — failure counter reset
    await expect(breaker.execute(fail)).rejects.toThrow("fail");
    // Only 1 failure, threshold is 2, so still closed
    const result = await breaker.execute(() => Promise.resolve("still open"));
    expect(result).toBe("still open");
  });

  it("resets failure count on success in closed state", async () => {
    const breaker = new CircuitBreaker({ failureThreshold: 3, resetTimeoutMs: 120_000 });
    const fail = () => Promise.reject(new Error("fail"));

    await expect(breaker.execute(fail)).rejects.toThrow("fail");
    await expect(breaker.execute(fail)).rejects.toThrow("fail");
    // 2 failures, 1 more would open

    await breaker.execute(() => Promise.resolve("ok")); // resets counter

    await expect(breaker.execute(fail)).rejects.toThrow("fail");
    await expect(breaker.execute(fail)).rejects.toThrow("fail");
    // Still only 2 failures since reset, not open yet

    const result = await breaker.execute(() => Promise.resolve("still closed"));
    expect(result).toBe("still closed");
  });

  it("exposes current state", async () => {
    const breaker = new CircuitBreaker({ failureThreshold: 1, resetTimeoutMs: 120_000 });

    expect(breaker.state).toBe("closed");

    await expect(breaker.execute(() => Promise.reject(new Error("fail")))).rejects.toThrow("fail");
    expect(breaker.state).toBe("open");

    vi.advanceTimersByTime(120_000);
    expect(breaker.state).toBe("half_open");
  });
});
