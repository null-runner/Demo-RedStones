type CircuitState = "closed" | "open" | "half_open";

type CircuitBreakerOptions = {
  failureThreshold: number;
  resetTimeoutMs: number;
};

export class CircuitBreaker {
  private _state: CircuitState = "closed";
  private failureCount = 0;
  private lastFailureTime = 0;
  private readonly failureThreshold: number;
  private readonly resetTimeoutMs: number;

  constructor(options: CircuitBreakerOptions) {
    this.failureThreshold = options.failureThreshold;
    this.resetTimeoutMs = options.resetTimeoutMs;
  }

  get state(): CircuitState {
    if (this._state === "open" && Date.now() - this.lastFailureTime >= this.resetTimeoutMs) {
      return "half_open";
    }
    return this._state;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    const currentState = this.state;

    if (currentState === "open") {
      throw new Error("Circuit breaker is open");
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this._state = "closed";
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this._state === "half_open" || this.failureCount >= this.failureThreshold) {
      this._state = "open";
    }
  }
}
