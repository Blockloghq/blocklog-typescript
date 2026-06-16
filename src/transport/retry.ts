const delay = (ms: number) =>
  new Promise(resolve => setTimeout(resolve, ms));

export class RetryPolicy {
  private maxRetries: number;
  private baseDelayMs: number;

  constructor(options?: { maxRetries?: number; baseDelayMs?: number }) {
    this.maxRetries = options?.maxRetries ?? 3;
    this.baseDelayMs = options?.baseDelayMs ?? 500;
  }

  private isRetryable(error: any): boolean {
    const status = error?.status;
    const name = error?.name;

    // Never retry auth errors regardless of status
    if (name === 'BlocklogAuthError' || name === 'AuthenticationError') {
      return false;
    }

    // Never retry validation errors
    if (name === 'ValidationError') {
      return false;
    }

    // Always retry RateLimitError (has no .status, only .retryAfter)
    if (name === 'RateLimitError') return true;

    // If there's an HTTP status, let the status decide for ALL error types
    if (typeof status === 'number') {
      if (status === 429) return true;
      if (status >= 500) return true;
      if (status >= 400 && status < 500) return false;
      return false;
    }

    // No HTTP status: retry network-level transport failures
    if (
      name === 'TransportError' ||
      name === 'BlocklogTransportError'
    ) {
      return true;
    }

    // Unknown errors without a status — retry
    return true;
  }

  public async run<T>(fn: () => Promise<T>): Promise<T> {
    let attempt = 0;

    while (true) {
      try {
        return await fn();
      } catch (error: any) {
        if (!this.isRetryable(error)) {
          throw error;
        }

        attempt++;

        if (attempt > this.maxRetries) {
          throw error;
        }

        const sleepTime = this.baseDelayMs * Math.pow(2, attempt - 1);
        await delay(sleepTime);
      }
    }
  }
}