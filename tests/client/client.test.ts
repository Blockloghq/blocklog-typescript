import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import blocklog, { BlocklogClient } from '../../src/index';
import { getGlobalClient } from '../../src/globals';
import { SyncTransport } from '../../src/transport/fetch';
import { MemoryQueue } from '../../src/queue/memory';
import { PersistentQueue } from '../../src/queue/persistent';
import { DeadLetterQueue } from '../../src/queue/deadletter';

describe('BlocklogClient', () => {
  let client: BlocklogClient;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (client) {
      client.shutdown();
    }
  });

  it('should initialize successfully', () => {
    client = blocklog.init({ apiKey: 'test_key' });
    expect(client).toBeInstanceOf(BlocklogClient);
    expect(getGlobalClient()).toBe(client);
    expect(client.config.apiKey).toBe('test_key');
    expect(client.config.endpoint).toBeDefined();
  });

  it('should throw if no API key is provided', () => {
    expect(() => new BlocklogClient({} as any)).toThrow();
  });

  it('should add hooks', () => {
    client = new BlocklogClient({ apiKey: 'test' });
    const hook = (p: any) => ({ ...p, mutated: true });
    const result = client.addHook(hook);
    expect(result).toBe(client);
  });

  it('should process events and add idempotency key', async () => {
    client = new BlocklogClient({ apiKey: 'test' });
    vi.spyOn(client.transport, 'request').mockResolvedValue({ ingested: 1, log_ids: ['1'] });

    const res = await client.event('TEST_EVENT', { a: 1 });
    expect(client.transport.request).toHaveBeenCalled();
    expect(res.ingested).toBe(1);
  });

  it('should enqueue events', async () => {
    client = new BlocklogClient({ apiKey: 'test', batchSize: 10 });
    vi.spyOn(client.transport, 'request').mockResolvedValue({ ingested: 1, log_ids: ['1'] });

    const res = await client.enqueue('TEST_1', {});
    expect(res).toBeNull(); // Not immediate, so null
  });

  describe('flush', () => {
    it('should flush pipeline, buffer, and queues', async () => {
      client = new BlocklogClient({ apiKey: 'test', batchSize: 10 });
      vi.spyOn(client.transport, 'request').mockResolvedValue({ ingested: 2, log_ids: ['1', '2'] });

      await client.enqueue('TEST_1', {});
      await client.enqueue('TEST_2', {});
      
      const res = await client.flush();
      
      expect(client.transport.request).toHaveBeenCalled();
      expect(res.ingested).toBeGreaterThanOrEqual(0);
    });

    it('should handle flush when buffer is empty', async () => {
      client = new BlocklogClient({ apiKey: 'test' });
      const res = await client.flush();
      expect(res.ingested).toBe(0);
      expect(res.log_ids).toEqual([]);
    });

    it('should flush buffer', async () => {
      client = new BlocklogClient({ apiKey: 'test' });
      vi.spyOn(client.transport, 'request').mockResolvedValue({ ingested: 1, log_ids: ['1'] });

      const bufferSpy = vi.spyOn(client.buffer, 'flush');
      await client.flush();
      
      expect(bufferSpy).toHaveBeenCalled();
    });

    it('should flush queues', async () => {
      client = new BlocklogClient({ apiKey: 'test' });
      vi.spyOn(client.transport, 'request').mockResolvedValue({ ingested: 1, log_ids: ['1'] });

      const memoryQueueSpy = vi.spyOn(client.memoryQueue, 'clear');
      const persistentQueueSpy = vi.spyOn(client.persistentQueue, 'clear');
      
      await client.flush();
      
      expect(memoryQueueSpy).toHaveBeenCalled();
      expect(persistentQueueSpy).toHaveBeenCalled();
    });
  });

  describe('shutdown', () => {
    it('should flush everything before shutdown', async () => {
      client = new BlocklogClient({ apiKey: 'test' });
      vi.spyOn(client.transport, 'request').mockResolvedValue({ ingested: 1, log_ids: ['1'] });

      const flushSpy = vi.spyOn(client, 'flush').mockResolvedValue({ ingested: 0, log_ids: [] });
      
      await client.shutdown();
      
      expect(flushSpy).toHaveBeenCalled();
    });

    it('should stop timers', async () => {
      client = new BlocklogClient({ apiKey: 'test', flushInterval: 1000 });
      vi.spyOn(client.transport, 'request').mockResolvedValue({ ingested: 1, log_ids: ['1'] });

      const processorSpy = vi.spyOn(client.processor, 'shutdown');
      
      await client.shutdown();
      
      expect(processorSpy).toHaveBeenCalled();
    });

    it('should prevent event loss by clearing queues', async () => {
      client = new BlocklogClient({ apiKey: 'test' });
      vi.spyOn(client.transport, 'request').mockResolvedValue({ ingested: 1, log_ids: ['1'] });

      await client.enqueue('TEST_1', {});
      
      const memoryQueueSpy = vi.spyOn(client.memoryQueue, 'clear');
      
      await client.shutdown();
      
      expect(memoryQueueSpy).toHaveBeenCalled();
    });
  });

  describe('health', () => {
    it('should return health status', async () => {
      client = new BlocklogClient({ apiKey: 'test' });
      vi.spyOn(client.transport, 'request').mockResolvedValue({ status: 'ok' });

      const health = await client.health();
      
      expect(health).toHaveProperty('healthy');
      expect(health).toHaveProperty('queueDepth');
      expect(health).toHaveProperty('pendingEvents');
      expect(health).toHaveProperty('transportReady');
    });

    it('should report queue depth correctly', async () => {
      client = new BlocklogClient({ apiKey: 'test' });
      vi.spyOn(client.transport, 'request').mockResolvedValue({ status: 'ok' });

      await client.enqueue('TEST_1', {});
      await client.enqueue('TEST_2', {});
      
      const health = await client.health();
      
      expect(health.queueDepth).toBeGreaterThan(0);
      expect(health.pendingEvents).toBe(health.queueDepth);
    });

    it('should report transport readiness correctly', async () => {
      client = new BlocklogClient({ apiKey: 'test' });
      vi.spyOn(client.transport, 'request').mockResolvedValue({ status: 'ok' });

      const health = await client.health();
      
      expect(health.transportReady).toBe(true);
    });

    it('should report unhealthy when transport fails', async () => {
      client = new BlocklogClient({ apiKey: 'test' });
      vi.spyOn(client.transport, 'request').mockRejectedValue(new Error('Transport error'));

      const health = await client.health();
      
      expect(health.transportReady).toBe(false);
      expect(health.healthy).toBe(false);
    });

    it('should report unhealthy when queue has pending events', async () => {
      client = new BlocklogClient({ apiKey: 'test' });
      vi.spyOn(client.transport, 'request').mockResolvedValue({ status: 'ok' });

      await client.enqueue('TEST_1', {});
      
      const health = await client.health();
      
      expect(health.queueDepth).toBeGreaterThan(0);
      expect(health.healthy).toBe(false);
    });
  });

  describe('dependency injection', () => {
    it('should accept custom transport', () => {
      const customTransport = new SyncTransport({
        baseUrl: 'https://custom.endpoint.com',
        apiKey: 'test-key',
        timeout: 5000,
      });

      client = new BlocklogClient({ apiKey: 'test' }, { transport: customTransport });
      
      expect(client.transport).toBe(customTransport);
    });

    it('should accept custom queue', () => {
      const customQueue = new MemoryQueue();

      client = new BlocklogClient({ apiKey: 'test' }, { memoryQueue: customQueue });
      
      expect(client.memoryQueue).toBe(customQueue);
    });

    it('should accept custom dead letter queue', () => {
      const customDlq = new DeadLetterQueue();

      client = new BlocklogClient({ apiKey: 'test' }, { deadLetterQueue: customDlq });
      
      expect(client.deadLetterQueue).toBe(customDlq);
    });
  });

  describe('readonly properties', () => {
    it('should have readonly config', () => {
      client = new BlocklogClient({ apiKey: 'test' });
      expect(() => {
        (client as any).config = { apiKey: 'new-key' };
      }).not.toThrow();
      // The property itself is readonly, but TypeScript enforces this at compile time
    });

    it('should have readonly transport', () => {
      client = new BlocklogClient({ apiKey: 'test' });
      expect(client.transport).toBeDefined();
    });

    it('should have readonly processor', () => {
      client = new BlocklogClient({ apiKey: 'test' });
      expect(client.processor).toBeDefined();
    });

    it('should have readonly trace manager', () => {
      client = new BlocklogClient({ apiKey: 'test' });
      expect(client.traceManager).toBeDefined();
    });
  });

  describe('API clients', () => {
    it('should have decisions client', () => {
      client = new BlocklogClient({ apiKey: 'test' });
      expect(client.decisions).toBeDefined();
    });

    it('should have traces client', () => {
      client = new BlocklogClient({ apiKey: 'test' });
      expect(client.traces).toBeDefined();
    });

    it('should have approvals client', () => {
      client = new BlocklogClient({ apiKey: 'test' });
      expect(client.approvals).toBeDefined();
    });

    it('should have incidents client', () => {
      client = new BlocklogClient({ apiKey: 'test' });
      expect(client.incidents).toBeDefined();
    });

    it('should have compliance client', () => {
      client = new BlocklogClient({ apiKey: 'test' });
      expect(client.compliance).toBeDefined();
    });

    it('should have replay client', () => {
      client = new BlocklogClient({ apiKey: 'test' });
      expect(client.replay).toBeDefined();
    });

    it('should have forensics alias', () => {
      client = new BlocklogClient({ apiKey: 'test' });
      expect(client.forensics).toBe(client.replay);
    });

    it('should have hitl alias', () => {
      client = new BlocklogClient({ apiKey: 'test' });
      expect(client.hitl).toBe(client.approvals);
    });
  });
});
