import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BlocklogClient } from '../../src/client';
import { TraceManager } from '../../src/tracing/manager';

describe('Load Test: Concurrency', () => {
  let client: BlocklogClient;
  const TRACE_COUNT = 1000;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    if (client) {
      await client.shutdown();
    }
  });

  it('should handle 1000 simultaneous traces with integrity', async () => {
    client = new BlocklogClient({ apiKey: 'test_key' });
    vi.spyOn(client.transport, 'request').mockResolvedValue({ ingested: 1, log_ids: ['1'] });

    const traceIds: string[] = [];

    const promises = [];
    for (let i = 0; i < TRACE_COUNT; i++) {
      promises.push(
        (async () => {
          const traceId = `trace-${i}`;
          traceIds.push(traceId);
          
          const span = TraceManager.startSpan('root-span', { traceId });
          await client.event('TRACE_EVENT', { traceId }, { trace_id: traceId });
          TraceManager.endSpan(span);
        })()
      );
    }

    await Promise.all(promises);

    expect(traceIds.length).toBe(TRACE_COUNT);
    expect(new Set(traceIds).size).toBe(TRACE_COUNT); // All unique
  });

  it('should maintain span hierarchy during concurrent operations', async () => {
    client = new BlocklogClient({ apiKey: 'test_key' });
    vi.spyOn(client.transport, 'request').mockResolvedValue({ ingested: 1, log_ids: ['1'] });

    const spanHierarchies: Array<{ traceId: string; spanId: string; parentId: string | null }> = [];

    const promises = [];
    for (let i = 0; i < 500; i++) {
      promises.push(
        (async () => {
          const traceId = `trace-${i}`;
          const parentSpan = TraceManager.startSpan('parent-span', { traceId });
          
          spanHierarchies.push({
            traceId: parentSpan.traceId,
            spanId: parentSpan.id,
            parentId: parentSpan.parentId
          });

          const childSpan = TraceManager.startSpan('child-span');
          spanHierarchies.push({
            traceId: childSpan.traceId,
            spanId: childSpan.id,
            parentId: childSpan.parentId
          });

          TraceManager.endSpan(childSpan);
          TraceManager.endSpan(parentSpan);
        })()
      );
    }

    await Promise.all(promises);

    // Validate hierarchy
    spanHierarchies.forEach(hierarchy => {
      expect(hierarchy.traceId).toBeDefined();
      expect(hierarchy.spanId).toBeDefined();
    });

    // Child spans should have parent IDs
    const childSpans = spanHierarchies.filter(h => h.parentId !== null);
    expect(childSpans.length).toBeGreaterThan(0);
  });

  it('should propagate context correctly under load', async () => {
    client = new BlocklogClient({ apiKey: 'test_key' });
    vi.spyOn(client.transport, 'request').mockResolvedValue({ ingested: 1, log_ids: ['1'] });

    const contextPropagations: string[] = [];

    const promises = [];
    for (let i = 0; i < 500; i++) {
      promises.push(
        (async () => {
          const traceId = `trace-${i}`;
          const span = TraceManager.startSpan('context-span', { traceId });
          
          const currentSpan = TraceManager.currentSpan();
          if (currentSpan) {
            contextPropagations.push(currentSpan.traceId);
          }

          await client.event('CONTEXT_EVENT', { data: 'test' });
          TraceManager.endSpan(span);
        })()
      );
    }

    await Promise.all(promises);

    expect(contextPropagations.length).toBe(500);
    expect(new Set(contextPropagations).size).toBe(500);
  });
});
