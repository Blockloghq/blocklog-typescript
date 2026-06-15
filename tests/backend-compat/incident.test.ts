import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { BlocklogClient } from '../../src/client';

describe('Backend Compatibility: Incident Events', () => {
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

  it('should generate and send incident event to backend', async () => {
    const incidentEvent = {
      incident_id: 'incident-123',
      incident_type: 'error',
      severity: 'high',
      description: 'Test incident',
      affected_components: ['agent-123', 'tool-456'],
    };

    const response = await client.event('incident.reported', incidentEvent);

    expect(response.ingested).toBe(1);
    expect(response.log_ids).toHaveLength(1);
  });

  it('should verify database persistence of incident event', async () => {
    const incidentEvent = {
      incident_id: 'incident-persistence-test',
      incident_type: 'error',
      severity: 'medium',
      description: 'Persistence test incident',
    };

    const response = await client.event('incident.reported', incidentEvent);
    const logId = response.log_ids[0];

    const verifyResponse = await client.transport.request('GET', `/api/v1/logs/${logId}`);

    expect(verifyResponse).toBeDefined();
    expect(verifyResponse.event_type).toBe('incident.reported');
  });

  it('should verify signature validation for incident event', async () => {
    const incidentEvent = {
      incident_id: 'incident-sig-test',
      incident_type: 'error',
      severity: 'low',
      description: 'Signature test incident',
    };

    const response = await client.event('incident.reported', incidentEvent);
    const logId = response.log_ids[0];

    const logResponse = await client.transport.request('GET', `/api/v1/logs/${logId}`);

    expect(logResponse.signature).toBeDefined();
    expect(logResponse.signature).not.toBe('');
  });

  it('should verify hash validation for incident event', async () => {
    const incidentEvent = {
      incident_id: 'incident-hash-test',
      incident_type: 'error',
      severity: 'low',
      description: 'Hash test incident',
    };

    const response = await client.event('incident.reported', incidentEvent);
    const logId = response.log_ids[0];

    const logResponse = await client.transport.request('GET', `/api/v1/logs/${logId}`);

    expect(logResponse.content_hash).toBeDefined();
    expect(logResponse.content_hash).not.toBe('');
  });
});
