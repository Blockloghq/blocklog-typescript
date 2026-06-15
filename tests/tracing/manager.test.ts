import { describe, it, expect, beforeEach } from 'vitest';
import { TraceManager } from '../../src/tracing/manager';
import { Span } from '../../src/tracing/span';

describe('TraceManager', () => {
  beforeEach(() => {
    // Clear any active spans before each test
    (TraceManager as any).activeSpans.clear();
  });

  describe('Span Creation', () => {
    it('should create a span with a name', () => {
      const span = TraceManager.startSpan('test-span');
      expect(span).toBeInstanceOf(Span);
      expect(span.name).toBe('test-span');
      expect(span.id).toBeDefined();
      expect(span.traceId).toBeDefined();
    });

    it('should create a span with custom options', () => {
      const customTraceId = 'custom-trace-id';
      const customParentId = 'custom-parent-id';
      const customMetadata = { key: 'value' };
      
      const span = TraceManager.startSpan('test-span', {
        traceId: customTraceId,
        parentId: customParentId,
        metadata: customMetadata,
      });
      
      expect(span.traceId).toBe(customTraceId);
      expect(span.parentId).toBe(customParentId);
      expect(span.metadata).toEqual(customMetadata);
    });

    it('should end a span successfully', () => {
      const span = TraceManager.startSpan('test-span');
      expect(span.endTime).toBeNull();
      
      TraceManager.endSpan(span, 'ok');
      expect(span.endTime).not.toBeNull();
    });

    it('should end a span with error status', () => {
      const span = TraceManager.startSpan('test-span');
      TraceManager.endSpan(span, 'error');
      
      expect(span.endTime).not.toBeNull();
    });

    it('should end a span by ID', () => {
      const span = TraceManager.startSpan('test-span');
      const spanId = span.id;
      
      TraceManager.endSpan(spanId, 'ok');
      expect(span.endTime).not.toBeNull();
    });
  });

  describe('Parent-Child Relationships', () => {
    it('should establish parent-child relationship when creating child span', () => {
      const parentSpan = TraceManager.startSpan('parent');
      TraceManager.runWithSpan(parentSpan, () => {
        const childSpan = TraceManager.startSpan('child');
        expect(childSpan.parentId).toBe(parentSpan.id);
        expect(childSpan.traceId).toBe(parentSpan.traceId);
      });
    });

    it('should preserve trace ID across parent and child spans', () => {
      const parentSpan = TraceManager.startSpan('parent');
      TraceManager.runWithSpan(parentSpan, () => {
        const childSpan = TraceManager.startSpan('child');
        expect(childSpan.traceId).toBe(parentSpan.traceId);
      });
    });

    it('should handle nested spans correctly', () => {
      const grandparent = TraceManager.startSpan('grandparent');
      TraceManager.runWithSpan(grandparent, () => {
        const parent = TraceManager.startSpan('parent');
        expect(parent.parentId).toBe(grandparent.id);
        
        TraceManager.runWithSpan(parent, () => {
          const child = TraceManager.startSpan('child');
          expect(child.parentId).toBe(parent.id);
          expect(child.traceId).toBe(grandparent.traceId);
        });
      });
    });

    it('should merge metadata from parent to child', () => {
      const parentSpan = TraceManager.startSpan('parent', {
        metadata: { parentKey: 'parentValue' },
      });
      
      TraceManager.runWithSpan(parentSpan, () => {
        const childSpan = TraceManager.startSpan('child', {
          metadata: { childKey: 'childValue' },
        });
        
        expect(childSpan.metadata).toEqual({
          parentKey: 'parentValue',
          childKey: 'childValue',
        });
      });
    });
  });

  describe('Async Context Propagation', () => {
    it('should retain trace state in async operations', async () => {
      const parentSpan = TraceManager.startSpan('parent');
      
      const childSpanPromise = TraceManager.runWithSpan(parentSpan, async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return TraceManager.startSpan('child');
      });
      
      const childSpan = await childSpanPromise;
      expect(childSpan.parentId).toBe(parentSpan.id);
      expect(childSpan.traceId).toBe(parentSpan.traceId);
    });

    it('should retain trace state in Promise.all', async () => {
      const parentSpan = TraceManager.startSpan('parent');
      
      const spans = await TraceManager.runWithSpan(parentSpan, async () => {
        return Promise.all([
          Promise.resolve(TraceManager.startSpan('child1')),
          Promise.resolve(TraceManager.startSpan('child2')),
          Promise.resolve(TraceManager.startSpan('child3')),
        ]);
      });
      
      spans.forEach(span => {
        expect(span.parentId).toBe(parentSpan.id);
        expect(span.traceId).toBe(parentSpan.traceId);
      });
    });

    it('should retain trace state in setTimeout', async () => {
      const parentSpan = TraceManager.startSpan('parent');
      
      const childSpanPromise = new Promise<Span>((resolve) => {
        TraceManager.runWithSpan(parentSpan, () => {
          setTimeout(() => {
            resolve(TraceManager.startSpan('child'));
          }, 10);
        });
      });
      
      const childSpan = await childSpanPromise;
      expect(childSpan.parentId).toBe(parentSpan.id);
      expect(childSpan.traceId).toBe(parentSpan.traceId);
    });
  });

  describe('Current Span', () => {
    it('should return current span when in context', () => {
      const span = TraceManager.startSpan('test');
      TraceManager.runWithSpan(span, () => {
        const current = TraceManager.currentSpan();
        expect(current).toBe(span);
      });
    });

    it('should return undefined when not in context', () => {
      const current = TraceManager.currentSpan();
      expect(current).toBeUndefined();
    });

    it('should return parent span when available', () => {
      const parent = TraceManager.startSpan('parent');
      TraceManager.runWithSpan(parent, () => {
        const child = TraceManager.startSpan('child');
        TraceManager.runWithSpan(child, () => {
          const currentParent = TraceManager.parentSpan();
          expect(currentParent).toBe(parent);
        });
      });
    });

    it('should return undefined for parent when no parent exists', () => {
      const span = TraceManager.startSpan('test');
      TraceManager.runWithSpan(span, () => {
        const parent = TraceManager.parentSpan();
        expect(parent).toBeUndefined();
      });
    });
  });

  describe('Error Spans', () => {
    it('should handle errors in span context', () => {
      const span = TraceManager.startSpan('test');
      
      try {
        TraceManager.runWithSpan(span, () => {
          throw new Error('Test error');
        });
      } catch (error) {
        // Error expected
      }
      
      TraceManager.endSpan(span, 'error');
      expect(span.endTime).not.toBeNull();
    });

    it('should create error spans for failed operations', () => {
      const agentSpan = TraceManager.startSpan('AGENT_ERROR');
      TraceManager.endSpan(agentSpan, 'error');
      
      expect(agentSpan.name).toBe('AGENT_ERROR');
      expect(agentSpan.endTime).not.toBeNull();
    });

    it('should create tool error spans', () => {
      const toolSpan = TraceManager.startSpan('TOOL_ERROR');
      TraceManager.endSpan(toolSpan, 'error');
      
      expect(toolSpan.name).toBe('TOOL_ERROR');
      expect(toolSpan.endTime).not.toBeNull();
    });
  });

  describe('Active Spans Management', () => {
    it('should track active spans', () => {
      const span1 = TraceManager.startSpan('span1');
      const span2 = TraceManager.startSpan('span2');
      
      expect((TraceManager as any).activeSpans.has(span1.id)).toBe(true);
      expect((TraceManager as any).activeSpans.has(span2.id)).toBe(true);
    });

    it('should remove span from active spans when ended', () => {
      const span = TraceManager.startSpan('test');
      expect((TraceManager as any).activeSpans.has(span.id)).toBe(true);
      
      TraceManager.endSpan(span);
      expect((TraceManager as any).activeSpans.has(span.id)).toBe(false);
    });

    it('should clean up active spans in runWithSpan', () => {
      const span = TraceManager.startSpan('test');
      TraceManager.runWithSpan(span, () => {
        expect((TraceManager as any).activeSpans.has(span.id)).toBe(true);
      });
      
      // After runWithSpan completes, span should still be active until explicitly ended
      expect((TraceManager as any).activeSpans.has(span.id)).toBe(true);
    });
  });
});
