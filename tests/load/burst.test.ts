import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BlocklogClient } from '../../src/client';

describe('Load Test: Burst', () => {
  let client: BlocklogClient;
  const EVENT_COUNT = 5000;
  const TIME_LIMIT_MS = 5000;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    if (client) {
      await client.shutdown();
    }
  });

  it('should process 5000 events in under 5 seconds', async () => {
    client = new BlocklogClient({ apiKey: 'test_key', batchSize: 200 });
    vi.spyOn(client.transport, 'request').mockResolvedValue({ ingested: 1, log_ids: ['1'] });

    const startTime = Date.now();
    let successCount = 0;

    const promises = [];
    for (let i = 0; i < EVENT_COUNT; i++) {
      promises.push(
        client.event('BURST_EVENT', { index: i })
          .then(() => successCount++)
      );
    }

    await Promise.all(promises);
    const duration = Date.now() - startTime;

    expect(successCount).toBe(EVENT_COUNT);
    expect(duration).toBeLessThan(TIME_LIMIT_MS);
    
    const throughput = (EVENT_COUNT / (duration / 1000)).toFixed(2);
    console.log(`Burst throughput: ${throughput} events/sec`);
  });

  it('should measure latency during burst', async () => {
    client = new BlocklogClient({ apiKey: 'test_key', batchSize: 100 });
    vi.spyOn(client.transport, 'request').mockImplementation(async () => {
      // Simulate network latency
      await new Promise(resolve => setTimeout(resolve, 1));
      return { ingested: 1, log_ids: ['1'] };
    });

    const latencies: number[] = [];

    for (let i = 0; i < 1000; i++) {
      const start = Date.now();
      await client.event('LATENCY_EVENT', { index: i });
      const latency = Date.now() - start;
      latencies.push(latency);
    }

    const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    const maxLatency = Math.max(...latencies);
    const p95Latency = latencies.sort((a, b) => a - b)[Math.floor(latencies.length * 0.95)];

    console.log(`Average latency: ${avgLatency}ms`);
    console.log(`P95 latency: ${p95Latency}ms`);
    console.log(`Max latency: ${maxLatency}ms`);

    expect(avgLatency).toBeLessThan(100);
    expect(p95Latency).toBeLessThan(200);
  });

  it('should handle burst with batching enabled', async () => {
    client = new BlocklogClient({ apiKey: 'test_key', batchSize: 500, flushInterval: 100 });
    vi.spyOn(client.transport, 'request').mockResolvedValue({ ingested: 1, log_ids: ['1'] });

    const startTime = Date.now();

    for (let i = 0; i < EVENT_COUNT; i++) {
      await client.enqueue('BATCH_EVENT', { index: i });
    }

    await client.flush();
    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(TIME_LIMIT_MS);
  });
});
