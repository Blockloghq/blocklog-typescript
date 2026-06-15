const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class RetryPolicy {
  private maxRetries: number;
  private baseDelayMs: number;

  constructor(options?: { maxRetries?: number; baseDelayMs?: number }) {
    this.maxRetries = options?.maxRetries ?? 3;
    this.baseDelayMs = options?.baseDelayMs ?? 500;
  }

  public async run<T>(fn: () => Promise<T>): Promise<T> {
    let attempt = 0;
    while (true) {
      try {
        return await fn();
      } catch (error: any) {
        attempt++;
        if (attempt > this.maxRetries) {
          throw error;
        }

        // Don't retry on Auth Errors or 4xx client errors
        if (error.status && error.status >= 400 && error.status < 500) {
          throw error;
        }

        const sleepTime = this.baseDelayMs * Math.pow(2, attempt - 1);
        await delay(sleepTime);
      }
    }
  }
}
