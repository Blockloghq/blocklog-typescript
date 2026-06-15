import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SyncTransport } from '../src/transport/fetch';
import { RetryPolicy } from '../src/transport/retry';

describe('Transport & Retry', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should format requests correctly', async () => {
    const transport = new SyncTransport({ baseUrl: 'http://test.com', apiKey: 'abc' });
    
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true })
    } as any);

    const res = await transport.request('POST', '/path', { json: { a: 1 }, params: { q: '1' } });
    
    expect(fetch).toHaveBeenCalledWith(
      'http://test.com/path?q=1',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Authorization': 'Bearer abc',
          'Content-Type': 'application/json',
          'User-Agent': 'blocklog-typescript/1.0.0',
        },
        body: '{"a":1}'
      })
    );
    expect(res).toEqual({ success: true });
  });

  it('should throw BlocklogAuthError on 401', async () => {
    const transport = new SyncTransport({ baseUrl: 'http://test.com', apiKey: 'abc' });
    
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => 'Unauthorized'
    } as any);

    await expect(transport.request('GET', '/path')).rejects.toThrow('Authentication failed');
  });

  it('should throw BlocklogTransportError on 500', async () => {
    const transport = new SyncTransport({ baseUrl: 'http://test.com', apiKey: 'abc' });
    
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => 'Server Error'
    } as any);

    await expect(transport.request('GET', '/path')).rejects.toThrow('Server Error');
  });

  it('should handle 204 No Content', async () => {
    const transport = new SyncTransport({ baseUrl: 'http://test.com', apiKey: 'abc' });
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 204
    } as any);

    const res = await transport.request('GET', '/path');
    expect(res).toBeNull();
  });

  it('RetryPolicy should retry on failure and eventually succeed', async () => {
    const retry = new RetryPolicy({ maxRetries: 2, baseDelayMs: 1 });
    
    let attempts = 0;
    const fn = vi.fn().mockImplementation(async () => {
      attempts++;
      if (attempts < 2) throw new Error('Network error');
      return 'success';
    });

    const res = await retry.run(fn);
    expect(res).toBe('success');
    expect(attempts).toBe(2);
  });

  it('RetryPolicy should fail if max retries exceeded', async () => {
    const retry = new RetryPolicy({ maxRetries: 1, baseDelayMs: 1 });
    const fn = vi.fn().mockRejectedValue(new Error('Network error'));
    
    await expect(retry.run(fn)).rejects.toThrow('Network error');
  });

  it('RetryPolicy should not retry on 4xx errors', async () => {
    const retry = new RetryPolicy({ maxRetries: 3, baseDelayMs: 1 });
    const error = new Error('Client error') as any;
    error.status = 400;
    
    const fn = vi.fn().mockRejectedValue(error);
    
    await expect(retry.run(fn)).rejects.toThrow('Client error');
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
