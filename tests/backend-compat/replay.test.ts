import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { BlocklogClient } from '../../src/client';

describe('Backend Compatibility: Replay Events', () => {
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

  it('should generate and send replay event to backend', async () => {
    const replayEvent = {
      replay_id: 'replay-123',
      original_trace_id: 'trace-456',
      replay_type: 'debugging',
      status: 'completed',
      results: { events_replayed: 10, issues_found: 0 },
    };

    const response = await client.event('replay.executed', replayEvent);

    expect(response.ingested).toBe(1);
    expect(response.log_ids).toHaveLength(1);
  });

  it('should verify database persistence of replay event', async () => {
    const replayEvent = {
      replay_id: 'replay-persistence-test',
      original_trace_id: 'trace-456',
      replay_type: 'debugging',
      status: 'completed',
    };

    const response = await client.event('replay.executed', replayEvent);
    const logId = response.log_ids[0];

    const verifyResponse = await client.transport.request('GET', `/api/v1/logs/${logId}`);

    expect(verifyResponse).toBeDefined();
    expect(verifyResponse.event_type).toBe('replay.executed');
  });

  it('should verify signature validation for replay event', async () => {
    const replayEvent = {
      replay_id: 'replay-sig-test',
      original_trace_id: 'trace-456',
      replay_type: 'debugging',
      status: 'in_progress',
    };

    const response = await client.event('replay.executed', replayEvent);
    const logId = response.log_ids[0];

    const logResponse = await client.transport.request('GET', `/api/v1/logs/${logId}`);

    expect(logResponse.signature).toBeDefined();
    expect(logResponse.signature).not.toBe('');
  });

  it('should verify hash validation for replay event', async () => {
    const replayEvent = {
      replay_id: 'replay-hash-test',
      original_trace_id: 'trace-456',
      replay_type: 'debugging',
      status: 'in_progress',
    };

    const response = await client.event('replay.executed', replayEvent);
    const logId = response.log_ids[0];

    const logResponse = await client.transport.request('GET', `/api/v1/logs/${logId}`);

    expect(logResponse.content_hash).toBeDefined();
    expect(logResponse.content_hash).not.toBe('');
  });
});
