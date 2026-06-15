import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { BlocklogClient } from '../../src/client';

describe('Backend Compatibility: Decision Events', () => {
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

  it('should generate and send decision event to backend', async () => {
    const decisionEvent = {
      decision_id: 'decision-123',
      decision_type: 'approval',
      context: { user: 'test-user', action: 'deploy' },
      outcome: 'approved',
      reasoning: 'All checks passed',
    };

    const response = await client.event('decision.made', decisionEvent);

    expect(response.ingested).toBe(1);
    expect(response.log_ids).toHaveLength(1);
  });

  it('should verify database persistence of decision event', async () => {
    const decisionEvent = {
      decision_id: 'decision-persistence-test',
      decision_type: 'approval',
      context: { user: 'test-user', action: 'deploy' },
      outcome: 'approved',
    };

    const response = await client.event('decision.made', decisionEvent);
    const logId = response.log_ids[0];

    const verifyResponse = await client.transport.request('GET', `/api/v1/logs/${logId}`);

    expect(verifyResponse).toBeDefined();
    expect(verifyResponse.event_type).toBe('decision.made');
  });

  it('should verify signature validation for decision event', async () => {
    const decisionEvent = {
      decision_id: 'decision-sig-test',
      decision_type: 'approval',
      context: { user: 'test-user' },
      outcome: 'approved',
    };

    const response = await client.event('decision.made', decisionEvent);
    const logId = response.log_ids[0];

    const logResponse = await client.transport.request('GET', `/api/v1/logs/${logId}`);

    expect(logResponse.signature).toBeDefined();
    expect(logResponse.signature).not.toBe('');
  });

  it('should verify hash validation for decision event', async () => {
    const decisionEvent = {
      decision_id: 'decision-hash-test',
      decision_type: 'approval',
      context: { user: 'test-user' },
      outcome: 'approved',
    };

    const response = await client.event('decision.made', decisionEvent);
    const logId = response.log_ids[0];

    const logResponse = await client.transport.request('GET', `/api/v1/logs/${logId}`);

    expect(logResponse.content_hash).toBeDefined();
    expect(logResponse.content_hash).not.toBe('');
  });
});
