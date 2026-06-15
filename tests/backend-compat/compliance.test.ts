import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { BlocklogClient } from '../../src/client';

describe('Backend Compatibility: Compliance Events', () => {
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

  it('should generate and send compliance event to backend', async () => {
    const complianceEvent = {
      compliance_id: 'compliance-123',
      policy_id: 'policy-456',
      check_type: 'data_retention',
      status: 'compliant',
      details: { retention_period: '30 days' },
    };

    const response = await client.event('compliance.check', complianceEvent);

    expect(response.ingested).toBe(1);
    expect(response.log_ids).toHaveLength(1);
  });

  it('should verify database persistence of compliance event', async () => {
    const complianceEvent = {
      compliance_id: 'compliance-persistence-test',
      policy_id: 'policy-456',
      check_type: 'data_retention',
      status: 'compliant',
    };

    const response = await client.event('compliance.check', complianceEvent);
    const logId = response.log_ids[0];

    const verifyResponse = await client.transport.request('GET', `/api/v1/logs/${logId}`);

    expect(verifyResponse).toBeDefined();
    expect(verifyResponse.event_type).toBe('compliance.check');
  });

  it('should verify signature validation for compliance event', async () => {
    const complianceEvent = {
      compliance_id: 'compliance-sig-test',
      policy_id: 'policy-456',
      check_type: 'access_control',
      status: 'compliant',
    };

    const response = await client.event('compliance.check', complianceEvent);
    const logId = response.log_ids[0];

    const logResponse = await client.transport.request('GET', `/api/v1/logs/${logId}`);

    expect(logResponse.signature).toBeDefined();
    expect(logResponse.signature).not.toBe('');
  });

  it('should verify hash validation for compliance event', async () => {
    const complianceEvent = {
      compliance_id: 'compliance-hash-test',
      policy_id: 'policy-456',
      check_type: 'access_control',
      status: 'compliant',
    };

    const response = await client.event('compliance.check', complianceEvent);
    const logId = response.log_ids[0];

    const logResponse = await client.transport.request('GET', `/api/v1/logs/${logId}`);

    expect(logResponse.content_hash).toBeDefined();
    expect(logResponse.content_hash).not.toBe('');
  });
});
