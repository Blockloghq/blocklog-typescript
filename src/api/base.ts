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

  protected request<T>(
    method: string,
    path: string,
    options?: Record<string, any>
  ): Promise<T> {
    const execute = () => {
      if (options === undefined) {
        return this.client.transport.request<T>(method, path);
      }

      return this.client.transport.request<T>(method, path, options);
    };

    if (method.toUpperCase() === 'GET') {
      return this.retryPolicy.run(execute);
    }

    return execute();
  }
}
