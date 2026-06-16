import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BlocklogClient } from '../../src/client';

describe('Load Test: Memory', () => {
  let client: BlocklogClient;
  const EVENT_COUNT = 100000;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    if (client) {
      await client.shutdown();
    }
  });

it('should handle 100000 events without memory leaks', async () => {
  client = new BlocklogClient({
    apiKey: 'test_key',
    batchSize: 1000,
  });

  const spy = vi
    .spyOn(client.transport, 'request')
    .mockResolvedValue({
      ingested: 1,
      log_ids: ['1'],
    });

  global.gc?.();
  const initialMemory = process.memoryUsage().heapUsed;
  let successCount = 0;

  for (let i = 0; i < EVENT_COUNT; i++) {
    await client.event('MEMORY_EVENT', {
      index: i,
      data: 'test data payload',
    });

    successCount++;

    if (i % 10000 === 0) {
      await client.flush();
    }
  }

  await client.flush();
  expect(client.memoryQueue.length).toBe(0);
  expect(client.persistentQueue.length).toBe(0);
  spy.mockRestore();
  await client.shutdown();
  global.gc?.();
  const finalMemory = process.memoryUsage().heapUsed;
  const memoryIncrease = finalMemory - initialMemory;
  const memoryIncreasePerEvent = memoryIncrease / EVENT_COUNT;

  expect(successCount).toBe(EVENT_COUNT);
  expect(memoryIncreasePerEvent).toBeLessThan(1280);
});
  
  it('should not lose events during memory pressure', async () => {
    client = new BlocklogClient({ apiKey: 'test_key', batchSize: 500 });
    vi.spyOn(client.transport, 'request').mockResolvedValue({ ingested: 1, log_ids: ['1'] });

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < EVENT_COUNT; i++) {
      try {
        await client.event('PRESSURE_EVENT', { 
          index: i, 
          data: 'x'.repeat(1000) // Larger payload
        });
        successCount++;
      } catch (error) {
        errorCount++;
      }
    }

    await client.flush();

    expect(errorCount).toBe(0);
    expect(successCount).toBe(EVENT_COUNT);
  });

  it('should handle queue memory efficiently', async () => {
    client = new BlocklogClient({ apiKey: 'test_key', batchSize: 100 });
    vi.spyOn(client.transport, 'request').mockResolvedValue({ ingested: 1, log_ids: ['1'] });

    const initialQueueSize = client.memoryQueue.length;

    // Enqueue many events
    for (let i = 0; i < 10000; i++) {
      await client.enqueue('QUEUE_EVENT', { index: i });
    }

    const midQueueSize = client.memoryQueue.length;
    
    await client.flush();
    
    const finalQueueSize = client.memoryQueue.length;

    expect(midQueueSize).toBeGreaterThan(initialQueueSize);
    expect(finalQueueSize).toBe(0);
  });
});
