import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { BlocklogClient } from '../../src/client';

describe('Backend Compatibility: Tool Events', () => {
  let client: BlocklogClient;
  const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';
  const API_KEY = process.env.API_KEY || 'test-key';

  beforeAll(() => {
    client = new BlocklogClient({
      apiKey: API_KEY,
      endpoint: BACKEND_URL,
    });
  });

  afterAll(async () => {
    await client.shutdown();
  });

  it('should generate and send tool event to backend', async () => {
    const toolEvent = {
      tool_id: 'tool-123',
      tool_name: 'test-tool',
      tool_type: 'api',
      parameters: { query: 'test' },
      result: { data: 'success' },
    };

    const response = await client.event('tool.execution', toolEvent);

    expect(response.ingested).toBe(1);
    expect(response.log_ids).toHaveLength(1);
  });

  it('should verify database persistence of tool event', async () => {
    const toolEvent = {
      tool_id: 'tool-persistence-test',
      tool_name: 'persistence-test-tool',
      tool_type: 'api',
      parameters: { query: 'test' },
    };

    const response = await client.event('tool.execution', toolEvent);
    const logId = response.log_ids[0];

    const verifyResponse = await client.transport.request('GET', `/api/v1/logs/${logId}`);

    expect(verifyResponse).toBeDefined();
    expect(verifyResponse.event_type).toBe('tool.execution');
  });

  it('should verify signature validation for tool event', async () => {
    const toolEvent = {
      tool_id: 'tool-sig-test',
      tool_name: 'signature-test-tool',
      tool_type: 'api',
    };

    const response = await client.event('tool.execution', toolEvent);
    const logId = response.log_ids[0];

    const logResponse = await client.transport.request('GET', `/api/v1/logs/${logId}`);

    expect(logResponse.signature).toBeDefined();
    expect(logResponse.signature).not.toBe('');
  });

  it('should verify hash validation for tool event', async () => {
    const toolEvent = {
      tool_id: 'tool-hash-test',
      tool_name: 'hash-test-tool',
      tool_type: 'api',
    };

    const response = await client.event('tool.execution', toolEvent);
    const logId = response.log_ids[0];

    const logResponse = await client.transport.request('GET', `/api/v1/logs/${logId}`);

    expect(logResponse.content_hash).toBeDefined();
    expect(logResponse.content_hash).not.toBe('');
  });
});
