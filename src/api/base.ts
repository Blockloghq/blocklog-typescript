import { BlocklogClient } from '../client';
import { RetryPolicy } from '../transport/retry';

export class BaseClient {
  protected client: BlocklogClient;
  protected retryPolicy: RetryPolicy;

  constructor(client: BlocklogClient) {
    this.client = client;

    this.retryPolicy = new RetryPolicy({
      maxRetries: client.config.retryCount,
    });
  }

  protected request(
  method: string,
  path: string,
  options?: Record<string, any>
) {
  return this.retryPolicy.run(() => {
    if (options === undefined) {
      return this.client.transport.request(method, path);
    }

    return this.client.transport.request(method, path, options);
  });
}
}