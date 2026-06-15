import { AsyncLocalStorage } from 'async_hooks';
import { Span, SpanOptions } from './span';
import { generateUUID } from '../utils/ids';

export class TraceManager {
  private static storage = new AsyncLocalStorage<Span>();
  private static activeSpans = new Map<string, Span>();

  public static startSpan(name: string, options?: SpanOptions): Span {
    const parent = this.currentSpan();
    const traceId = options?.traceId || parent?.traceId || generateUUID();
    const parentId = options?.parentId || parent?.id || null;
    
    // Merge existing metadata if parent is available
    const mergedMetadata = {
      ...(parent?.metadata || {}),
      ...(options?.metadata || {}),
    };

    const span = new Span(name, {
      traceId,
      parentId,
      metadata: mergedMetadata,
    });
    this.activeSpans.set(span.id, span);
    return span;
  }

  public static endSpan(span: Span | string, status: 'ok' | 'error' = 'ok'): void {
    const spanId = typeof span === 'string' ? span : span.id;
    const actualSpan = this.activeSpans.get(spanId) || (typeof span !== 'string' ? span : undefined);
    if (actualSpan) {
      actualSpan.end(status);
      this.activeSpans.delete(spanId);
    }
  }

  public static currentSpan(): Span | undefined {
    return this.storage.getStore();
  }

  public static parentSpan(): Span | undefined {
    const current = this.currentSpan();
    if (!current || !current.parentId) return undefined;
    return this.activeSpans.get(current.parentId);
  }

  public static runWithSpan<T>(span: Span, callback: () => T): T {
    // Register the span as active in activeSpans map
    this.activeSpans.set(span.id, span);
    return this.storage.run(span, () => {
      try {
        return callback();
      } finally {
        // Just in case, clean up active map reference if the span ended
        if (span.endTime !== null) {
          this.activeSpans.delete(span.id);
        }
      }
    });
  }
}
