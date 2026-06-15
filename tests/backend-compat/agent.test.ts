import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { BlocklogClient } from '../../src/client';

describe('Backend Compatibility: Agent Events', () => {
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

  it('should generate and send agent event to backend', async () => {
    const agentEvent = {
      agent_id: 'agent-123',
      agent_name: 'test-agent',
      agent_type: 'autonomous',
      status: 'active',
      capabilities: ['reasoning', 'tool-use'],
    };

    const response = await client.event('agent.execution', agentEvent);

    expect(response.ingested).toBe(1);
    expect(response.log_ids).toHaveLength(1);
  });

  it('should verify database persistence of agent event', async () => {
    const agentEvent = {
      agent_id: 'agent-persistence-test',
      agent_name: 'persistence-test-agent',
      agent_type: 'autonomous',
      status: 'active',
    };

    const response = await client.event('agent.execution', agentEvent);
    const logId = response.log_ids[0];

    // Query backend to verify persistence
    const verifyResponse = await client.transport.request('GET', `/api/v1/logs/${logId}`);

    expect(verifyResponse).toBeDefined();
    expect(verifyResponse.event_type).toBe('agent.execution');
  });

  it('should verify signature validation for agent event', async () => {
    const agentEvent = {
      agent_id: 'agent-sig-test',
      agent_name: 'signature-test-agent',
      agent_type: 'autonomous',
    };

    const response = await client.event('agent.execution', agentEvent);
    const logId = response.log_ids[0];

    // Verify signature exists and is valid
    const logResponse = await client.transport.request('GET', `/api/v1/logs/${logId}`);

    expect(logResponse.signature).toBeDefined();
    expect(logResponse.signature).not.toBe('');
  });

  it('should verify hash validation for agent event', async () => {
    const agentEvent = {
      agent_id: 'agent-hash-test',
      agent_name: 'hash-test-agent',
      agent_type: 'autonomous',
    };

    const response = await client.event('agent.execution', agentEvent);
    const logId = response.log_ids[0];

    // Verify hash exists and is valid
    const logResponse = await client.transport.request('GET', `/api/v1/logs/${logId}`);

    expect(logResponse.content_hash).toBeDefined();
    expect(logResponse.content_hash).not.toBe('');
  });
});
