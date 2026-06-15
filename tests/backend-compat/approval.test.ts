import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { BlocklogClient } from '../../src/client';

describe('Backend Compatibility: Approval Events', () => {
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

  it('should generate and send approval event to backend', async () => {
    const approvalEvent = {
      approval_id: 'approval-123',
      approval_type: 'human-in-the-loop',
      requester: 'agent-123',
      approver: 'user-456',
      status: 'approved',
      metadata: { reason: 'Manual review required' },
    };

    const response = await client.event('approval.requested', approvalEvent);

    expect(response.ingested).toBe(1);
    expect(response.log_ids).toHaveLength(1);
  });

  it('should verify database persistence of approval event', async () => {
    const approvalEvent = {
      approval_id: 'approval-persistence-test',
      approval_type: 'human-in-the-loop',
      requester: 'agent-123',
      approver: 'user-456',
      status: 'approved',
    };

    const response = await client.event('approval.requested', approvalEvent);
    const logId = response.log_ids[0];

    const verifyResponse = await client.transport.request('GET', `/api/v1/logs/${logId}`);

    expect(verifyResponse).toBeDefined();
    expect(verifyResponse.event_type).toBe('approval.requested');
  });

  it('should verify signature validation for approval event', async () => {
    const approvalEvent = {
      approval_id: 'approval-sig-test',
      approval_type: 'human-in-the-loop',
      requester: 'agent-123',
      status: 'pending',
    };

    const response = await client.event('approval.requested', approvalEvent);
    const logId = response.log_ids[0];

    const logResponse = await client.transport.request('GET', `/api/v1/logs/${logId}`);

    expect(logResponse.signature).toBeDefined();
    expect(logResponse.signature).not.toBe('');
  });

  it('should verify hash validation for approval event', async () => {
    const approvalEvent = {
      approval_id: 'approval-hash-test',
      approval_type: 'human-in-the-loop',
      requester: 'agent-123',
      status: 'pending',
    };

    const response = await client.event('approval.requested', approvalEvent);
    const logId = response.log_ids[0];

    const logResponse = await client.transport.request('GET', `/api/v1/logs/${logId}`);

    expect(logResponse.content_hash).toBeDefined();
    expect(logResponse.content_hash).not.toBe('');
  });
});
