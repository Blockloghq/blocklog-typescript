import { BlocklogAuthError, BlocklogTransportError } from '../errors';

export class SyncTransport {
  private baseUrl: string;
  private apiKey: string;
  private timeoutMs: number;

  constructor(options: { baseUrl: string; apiKey: string; timeout?: number }) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '');
    this.apiKey = options.apiKey;
    this.timeoutMs = options.timeout || 10000;
  }

  public async request(method: string, path: string, options?: { json?: any; params?: Record<string, string> }): Promise<any> {
    const url = new URL(this.baseUrl + path);
    if (options?.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': 'blocklog-typescript/1.0.0',
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url.toString(), {
        method,
        headers,
        body: options?.json ? JSON.stringify(options.json) : undefined,
        signal: controller.signal as any,
      });

      if (!response.ok) {
        const text = await response.text();
        if (response.status === 401 || response.status === 403) {
          throw new BlocklogAuthError(`Authentication failed: ${response.status} ${text}`);
        }
        throw new BlocklogTransportError(`HTTP Error ${response.status}: ${text}`, response.status, text);
      }

      if (response.status === 204) {
        return null;
      }

      return await response.json();
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new BlocklogTransportError(`Request timed out after ${this.timeoutMs}ms`);
      }
      if (error instanceof BlocklogAuthError || error instanceof BlocklogTransportError) {
        throw error;
      }
      throw new BlocklogTransportError(error?.message || 'Unknown transport error');
    } finally {
      clearTimeout(timeoutId);
    }
  }
}