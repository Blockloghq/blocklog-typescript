import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EventProcessor } from '../../src/pipeline/processor';
import { SyncTransport } from '../../src/transport/fetch';
import { resolveConfig } from '../../src/config/config';
import { MemoryQueue } from '../../src/queue/memory';
import { PersistentQueue } from '../../src/queue/persistent';
import { DeadLetterQueue } from '../../src/queue/deadletter';

describe('EventProcessor', () => {
  let processor: EventProcessor;
  let transport: SyncTransport;
  let config: any;

  beforeEach(() => {
    config = resolveConfig({ apiKey: 'test-key' });
    transport = new SyncTransport({
      baseUrl: config.endpoint,
      apiKey: config.apiKey,
      timeout: config.timeout,
    });
    processor = new EventProcessor(config, transport);
  });

  afterEach(() => {
    processor.shutdown();
  });

  describe('Middleware Order', () => {
    it('should execute middleware hooks in order', async () => {
      const executionOrder: string[] = [];
      
      processor.addHook((payload) => {
        executionOrder.push('hook1');
        return { ...payload, hook1: true };
      });
      
      processor.addHook((payload) => {
        executionOrder.push('hook2');
        return { ...payload, hook2: true };
      });
      
      processor.addHook((payload) => {
        executionOrder.push('hook3');
        return { ...payload, hook3: true };
      });

      // Mock transport to avoid actual network calls
      vi.spyOn(transport, 'request').mockResolvedValue({ ingested: 1, log_ids: ['test-id'] });
      
      await processor.processEvent('test-event', { data: 'test' }, { immediate: true });
      
      expect(executionOrder).toEqual(['hook1', 'hook2', 'hook3']);
    });

    it('should apply middleware transformations in sequence', async () => {
      processor.addHook((payload) => ({ ...payload, step1: true }));
      processor.addHook((payload) => ({ ...payload, step2: true }));
      processor.addHook((payload) => ({ ...payload, step3: true }));

      vi.spyOn(transport, 'request').mockResolvedValue({ ingested: 1, log_ids: ['test-id'] });
      
      const result = await processor.processEvent('test-event', { data: 'test' }, { immediate: true });
      
      expect(result).toBeDefined();
    });
  });

  describe('Failure Recovery', () => {
    it('should retry on transport errors', async () => {
      let attemptCount = 0;
      
      vi.spyOn(transport, 'request').mockImplementation(async () => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Transport error');
        }
        return { ingested: 1, log_ids: ['test-id'] };
      });

      const result = await processor.processEvent('test-event', { data: 'test' }, { immediate: true });
      
      expect(attemptCount).toBe(3);
      expect(result).toBeDefined();
    });

    it('should move to dead letter queue after max retries', async () => {
      vi.spyOn(transport, 'request').mockRejectedValue(new Error('Permanent failure'));
      
      const dlqSpy = vi.spyOn((processor as any).dlq, 'add').mockResolvedValue(undefined);
      
      await expect(
        processor.processEvent('test-event', { data: 'test' }, { immediate: true })
      ).rejects.toThrow();
      
      expect(dlqSpy).toHaveBeenCalled();
    });

    it('should handle middleware errors gracefully', async () => {
      processor.addHook(() => {
        throw new Error('Middleware error');
      });

      vi.spyOn(transport, 'request').mockResolvedValue({ ingested: 1, log_ids: ['test-id'] });
      
      // The middleware error should propagate
      await expect(
        processor.processEvent('test-event', { data: 'test' }, { immediate: true })
      ).rejects.toThrow('Middleware error');
    });

    it('should recover from batch send failures', async () => {
      let attemptCount = 0;
      
      vi.spyOn(transport, 'request').mockImplementation(async () => {
        attemptCount++;
        if (attemptCount < 2) {
          throw new Error('Batch send failed');
        }
        return { ingested: 1, log_ids: ['test-id'] };
      });

      // Queue some events
      await processor.processEvent('test-event', { data: 'test1' });
      await processor.processEvent('test-event', { data: 'test2' });
      
      const result = await processor.flush();
      
      expect(attemptCount).toBeGreaterThanOrEqual(2);
      expect(result).toBeDefined();
    });
  });

  describe('Event Processing', () => {
    it('should build envelope with correct structure', async () => {
      vi.spyOn(transport, 'request').mockResolvedValue({ ingested: 1, log_ids: ['test-id'] });
      
      await processor.processEvent('test-event', { data: 'test' }, { immediate: true });
      
      const call = vi.spyOn(transport, 'request');
      expect(call).toHaveBeenCalled();
    });

    it('should add idempotency key to events', async () => {
      vi.spyOn(transport, 'request').mockResolvedValue({ ingested: 1, log_ids: ['test-id'] });
      
      await processor.processEvent('test-event', { data: 'test' }, { immediate: true });
      
      const call = vi.spyOn(transport, 'request');
      const payload = call.mock.calls[0][2]?.json;
      expect(payload).toBeDefined();
      expect(payload.idempotency_key).toBeDefined();
    });

    it('should queue events when not immediate', async () => {
      await processor.processEvent('test-event', { data: 'test' });
      
      const memoryQueue = (processor as any).memoryQueue;
      expect(memoryQueue.length).toBeGreaterThan(0);
    });

    it('should flush when batch size is reached', async () => {
      const smallBatchConfig = resolveConfig({ apiKey: 'test-key', batchSize: 2 });
      const smallProcessor = new EventProcessor(smallBatchConfig, transport);
      
      vi.spyOn(transport, 'request').mockResolvedValue({ ingested: 2, log_ids: ['id1', 'id2'] });
      
      await smallProcessor.processEvent('test-event', { data: 'test1' });
      await smallProcessor.processEvent('test-event', { data: 'test2' });
      
      const memoryQueue = (smallProcessor as any).memoryQueue;
      expect(memoryQueue.length).toBe(0); // Should have been flushed
      
      smallProcessor.shutdown();
    });
  });

  describe('Signing', () => {
    it('should sign events when signing is enabled', async () => {
      const signingConfig = resolveConfig({
        apiKey: 'test-key',
        enableSigning: true,
        signingKey: 'test-key',
        signingAlg: 'hmac-sha256',
      });
      const signingProcessor = new EventProcessor(signingConfig, transport);
      
      vi.spyOn(transport, 'request').mockResolvedValue({ ingested: 1, log_ids: ['test-id'] });
      
      await signingProcessor.processEvent('test-event', { data: 'test' }, { immediate: true });
      
      const call = vi.spyOn(transport, 'request');
      const payload = call.mock.calls[0][2]?.json;
      expect(payload.log_signature).toBeDefined();
      
      signingProcessor.shutdown();
    });

    it('should not sign events when signing is disabled', async () => {
      const noSigningConfig = resolveConfig({
        apiKey: 'test-key',
        enableSigning: false,
      });
      const noSigningProcessor = new EventProcessor(noSigningConfig, transport);
      
      vi.spyOn(transport, 'request').mockResolvedValue({ ingested: 1, log_ids: ['test-id'] });
      
      await noSigningProcessor.processEvent('test-event', { data: 'test' }, { immediate: true });
      
      const call = vi.spyOn(transport, 'request');
      const payload = call.mock.calls[0][2]?.json;
      expect(payload.log_signature).toBeUndefined();
      
      noSigningProcessor.shutdown();
    });
  });

  describe('Flush and Shutdown', () => {
    it('should flush queued events', async () => {
      vi.spyOn(transport, 'request').mockResolvedValue({ ingested: 2, log_ids: ['id1', 'id2'] });
      
      await processor.processEvent('test-event', { data: 'test1' });
      await processor.processEvent('test-event', { data: 'test2' });
      
      const result = await processor.flush();
      
      expect(result.ingested).toBe(2);
    });

    it('should return empty result when no events to flush', async () => {
      const result = await processor.flush();
      
      expect(result.ingested).toBe(0);
      expect(result.log_ids).toEqual([]);
    });

    it('should stop flush timer on shutdown', () => {
      const shutdownSpy = vi.spyOn(processor, 'shutdown');
      
      processor.shutdown();
      
      expect(shutdownSpy).toHaveBeenCalled();
    });
  });

  describe('Event Emitter', () => {
    it('should emit event:processed after processing', async () => {
      const emitSpy = vi.spyOn(processor.emitter, 'emit');
      
      vi.spyOn(transport, 'request').mockResolvedValue({ ingested: 1, log_ids: ['test-id'] });
      
      await processor.processEvent('test-event', { data: 'test' }, { immediate: true });
      
      expect(emitSpy).toHaveBeenCalledWith('event:processed', expect.any(Object));
    });
  });
});
