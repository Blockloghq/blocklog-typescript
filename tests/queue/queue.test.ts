import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MemoryQueue } from '../../src/queue/memory';
import { PersistentQueue } from '../../src/queue/persistent';
import { DeadLetterQueue } from '../../src/queue/deadletter';
import { EventEnvelope } from '../../src/models/events';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('Queue Tests', () => {
  describe('Memory Queue', () => {
    let queue: MemoryQueue;

    beforeEach(() => {
      queue = new MemoryQueue();
    });

    it('should enqueue items', async () => {
      const item: EventEnvelope = {
        event_type: 'test',
        payload: { data: 'test' },
        timestamp: new Date().toISOString(),
        source: 'test',
        schema_version: '1.0',
        event_version: '1.0',
      } as any;

      await queue.enqueue(item);
      expect(queue.length).toBe(1);
    });

    it('should dequeue items', async () => {
      const item: EventEnvelope = {
        event_type: 'test',
        payload: { data: 'test' },
        timestamp: new Date().toISOString(),
        source: 'test',
        schema_version: '1.0',
        event_version: '1.0',
      } as any;

      await queue.enqueue(item);
      const dequeued = await queue.dequeue(1);
      
      expect(dequeued).toHaveLength(1);
      expect(dequeued[0]).toEqual(item);
      expect(queue.length).toBe(0);
    });

    it('should peek at items without removing', async () => {
      const item: EventEnvelope = {
        event_type: 'test',
        payload: { data: 'test' },
        timestamp: new Date().toISOString(),
        source: 'test',
        schema_version: '1.0',
        event_version: '1.0',
      } as any;

      await queue.enqueue(item);
      const peeked = await queue.peek(1);
      
      expect(peeked).toHaveLength(1);
      expect(peeked[0]).toEqual(item);
      expect(queue.length).toBe(1); // Should still be there
    });

    it('should enqueue batch of items', async () => {
      const items: EventEnvelope[] = [
        {
          event_type: 'test1',
          payload: { data: 'test1' },
          timestamp: new Date().toISOString(),
          source: 'test',
          schema_version: '1.0',
          event_version: '1.0',
        } as any,
        {
          event_type: 'test2',
          payload: { data: 'test2' },
          timestamp: new Date().toISOString(),
          source: 'test',
          schema_version: '1.0',
          event_version: '1.0',
        } as any,
      ];

      await queue.enqueueBatch(items);
      expect(queue.length).toBe(2);
    });

    it('should clear all items', async () => {
      const item: EventEnvelope = {
        event_type: 'test',
        payload: { data: 'test' },
        timestamp: new Date().toISOString(),
        source: 'test',
        schema_version: '1.0',
        event_version: '1.0',
      } as any;

      await queue.enqueue(item);
      await queue.clear();
      
      expect(queue.length).toBe(0);
    });

    it('should handle dequeue count larger than queue size', async () => {
      const item: EventEnvelope = {
        event_type: 'test',
        payload: { data: 'test' },
        timestamp: new Date().toISOString(),
        source: 'test',
        schema_version: '1.0',
        event_version: '1.0',
      } as any;

      await queue.enqueue(item);
      const dequeued = await queue.dequeue(10);
      
      expect(dequeued).toHaveLength(1);
      expect(queue.length).toBe(0);
    });
  });

  describe('Persistent Queue', () => {
    let queue: PersistentQueue;
    let tempFilePath: string;

    beforeEach(() => {
      tempFilePath = path.join(os.tmpdir(), `test-queue-${Date.now()}.json`);
      queue = new PersistentQueue(tempFilePath);
    });

    afterEach(() => {
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    });

    it('should enqueue items and persist to disk', async () => {
      const item: EventEnvelope = {
        event_type: 'test',
        payload: { data: 'test' },
        timestamp: new Date().toISOString(),
        source: 'test',
        schema_version: '1.0',
        event_version: '1.0',
      } as any;

      await queue.enqueue(item);
      
      expect(fs.existsSync(tempFilePath)).toBe(true);
      expect(queue.length).toBe(1);
    });

    it('should recover items from disk on restart', async () => {
      const item: EventEnvelope = {
        event_type: 'test',
        payload: { data: 'test' },
        timestamp: new Date().toISOString(),
        source: 'test',
        schema_version: '1.0',
        event_version: '1.0',
      } as any;

      await queue.enqueue(item);
      
      // Create new queue instance to simulate restart
      const newQueue = new PersistentQueue(tempFilePath);
      expect(newQueue.length).toBe(1);
      
      const recovered = await newQueue.peek(1);
      expect(recovered[0]).toEqual(item);
    });

    it('should dequeue items and persist changes', async () => {
      const item: EventEnvelope = {
        event_type: 'test',
        payload: { data: 'test' },
        timestamp: new Date().toISOString(),
        source: 'test',
        schema_version: '1.0',
        event_version: '1.0',
      } as any;

      await queue.enqueue(item);
      await queue.dequeue(1);
      
      expect(queue.length).toBe(0);
      
      // Verify persistence
      const newQueue = new PersistentQueue(tempFilePath);
      expect(newQueue.length).toBe(0);
    });

    it('should clear items and delete file', async () => {
      const item: EventEnvelope = {
        event_type: 'test',
        payload: { data: 'test' },
        timestamp: new Date().toISOString(),
        source: 'test',
        schema_version: '1.0',
        event_version: '1.0',
      } as any;

      await queue.enqueue(item);
      await queue.clear();
      
      expect(queue.length).toBe(0);
      expect(fs.existsSync(tempFilePath)).toBe(false);
    });

    it('should handle corrupted file gracefully', async () => {
      // Write corrupted data
      fs.writeFileSync(tempFilePath, 'invalid json');
      
      const newQueue = new PersistentQueue(tempFilePath);
      expect(newQueue.length).toBe(0);
    });

    it('should replay items from persistent storage', async () => {
      const items: EventEnvelope[] = [
        {
          event_type: 'test1',
          payload: { data: 'test1' },
          timestamp: new Date().toISOString(),
          source: 'test',
          schema_version: '1.0',
          event_version: '1.0',
        } as any,
        {
          event_type: 'test2',
          payload: { data: 'test2' },
          timestamp: new Date().toISOString(),
          source: 'test',
          schema_version: '1.0',
          event_version: '1.0',
        } as any,
      ];

      await queue.enqueueBatch(items);
      
      // Simulate restart
      const newQueue = new PersistentQueue(tempFilePath);
      const replayed = await newQueue.peek(2);
      
      expect(replayed).toHaveLength(2);
      expect(replayed[0]).toEqual(items[0]);
      expect(replayed[1]).toEqual(items[1]);
    });
  });

  describe('Dead Letter Queue', () => {
    let dlq: DeadLetterQueue;
    let tempFilePath: string;

    beforeEach(() => {
      tempFilePath = path.join(os.tmpdir(), `test-dlq-${Date.now()}.json`);
      dlq = new DeadLetterQueue(tempFilePath);
    });

    afterEach(() => {
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    });

    it('should add failed items with error message', async () => {
      const item: EventEnvelope = {
        event_type: 'test',
        payload: { data: 'test' },
        timestamp: new Date().toISOString(),
        source: 'test',
        schema_version: '1.0',
        event_version: '1.0',
      } as any;

      await dlq.add(item, 'Transport error');
      
      const failedItems = await dlq.getEntries();
      expect(failedItems).toHaveLength(1);
      expect(failedItems[0].event).toEqual(item);
      expect(failedItems[0].reason).toBe('Transport error');
      expect(failedItems[0].failedAt).toBeDefined();
    });

    it('should persist failed items to disk', async () => {
      const item: EventEnvelope = {
        event_type: 'test',
        payload: { data: 'test' },
        timestamp: new Date().toISOString(),
        source: 'test',
        schema_version: '1.0',
        event_version: '1.0',
      } as any;

      await dlq.add(item, 'Test error');
      
      expect(fs.existsSync(tempFilePath)).toBe(true);
    });

    it('should recover failed items on restart', async () => {
      const item: EventEnvelope = {
        event_type: 'test',
        payload: { data: 'test' },
        timestamp: new Date().toISOString(),
        source: 'test',
        schema_version: '1.0',
        event_version: '1.0',
      } as any;

      await dlq.add(item, 'Test error');
      
      // Create new DLQ instance
      const newDlq = new DeadLetterQueue(tempFilePath);
      const failedItems = await newDlq.getEntries();
      
      expect(failedItems).toHaveLength(1);
      expect(failedItems[0].event).toEqual(item);
    });

    it('should clear all failed items', async () => {
      const item: EventEnvelope = {
        event_type: 'test',
        payload: { data: 'test' },
        timestamp: new Date().toISOString(),
        source: 'test',
        schema_version: '1.0',
        event_version: '1.0',
      } as any;

      await dlq.add(item, 'Test error');
      await dlq.clear();
      
      const failedItems = await dlq.getEntries();
      expect(failedItems).toHaveLength(0);
    });

    it('should handle max retry exceeded scenario', async () => {
      const item: EventEnvelope = {
        event_type: 'test',
        payload: { data: 'test' },
        timestamp: new Date().toISOString(),
        source: 'test',
        schema_version: '1.0',
        event_version: '1.0',
      } as any;

      // Simulate max retry exceeded
      await dlq.add(item, 'Max retry exceeded');
      
      const failedItems = await dlq.getEntries();
      expect(failedItems).toHaveLength(1);
      expect(failedItems[0].reason).toContain('retry');
    });

    it('should get count of failed items', async () => {
      const item: EventEnvelope = {
        event_type: 'test',
        payload: { data: 'test' },
        timestamp: new Date().toISOString(),
        source: 'test',
        schema_version: '1.0',
        event_version: '1.0',
      } as any;

      await dlq.add(item, 'Error 1');
      await dlq.add(item, 'Error 2');
      await dlq.add(item, 'Error 3');
      
      const count = dlq.length;
      expect(count).toBe(3);
    });
  });
});
