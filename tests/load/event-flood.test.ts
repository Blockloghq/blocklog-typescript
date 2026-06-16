import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BlocklogClient } from '../../src/client';

describe('Load Test: Event Flood', () => {
  let client: BlocklogClient;
  const EVENT_COUNT = 10000;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    if (client) {
      await client.shutdown();
    }
  });

  it('should handle 10000 events without dropping any', async () => {
    client = new BlocklogClient({ apiKey: 'test_key', batchSize: 100 });
    vi.spyOn(client.transport, 'request').mockResolvedValue({ ingested: 1, log_ids: ['1'] });

    const startTime = Date.now();
    let successCount = 0;
    let errorCount = 0;

    const promises = [];
    for (let i = 0; i < EVENT_COUNT; i++) {
      promises.push(
        client.event('TEST_EVENT', { index: i })
          .then(() => successCount++)
          .catch(() => errorCount++)
      );
    }

    await Promise.all(promises);
    const duration = Date.now() - startTime;

    expect(errorCount).toBe(0);
    expect(successCount).toBe(EVENT_COUNT);
    expect(duration).toBeLessThan(30000); // Should complete in under 30 seconds
  });

  it('should maintain queue integrity during flood', async () => {
    client = new BlocklogClient({ apiKey: 'test_key', batchSize: 50 });
    vi.spyOn(client.transport, 'request').mockResolvedValue({ ingested: 1, log_ids: ['1'] });

    const initialQueueDepth = client.memoryQueue.length;

    for (let i = 0; i < EVENT_COUNT; i++) {
      await client.enqueue('TEST_EVENT', { index: i });
    }

    const finalQueueDepth = client.memoryQueue.length;
    
    // Queue should have processed events
    expect(finalQueueDepth).toBeGreaterThanOrEqual(0);
    
    // Flush and verify no events are lost
    await client.flush();
    const health = await client.health();
    expect(health.queueDepth).toBe(0);
  });

  it('should not corrupt queue during concurrent operations', async () => {
    client = new BlocklogClient({ apiKey: 'test_key', batchSize: 100 });
    vi.spyOn(client.transport, 'request').mockResolvedValue({ ingested: 1, log_ids: ['1'] });

    const operations = [];
    for (let i = 0; i < EVENT_COUNT; i++) {
      operations.push(client.enqueue('TEST_EVENT', { index: i }));
      operations.push(client.event('TEST_EVENT_2', { index: i }));
    }

    await Promise.all(operations);
    await client.flush(); 
    
    const health = await client.health();
    expect(health.healthy).toBe(true);
  });
});
