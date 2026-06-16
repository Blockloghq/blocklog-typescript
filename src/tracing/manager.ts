import { AsyncLocalStorage } from 'async_hooks';
import { Span, SpanOptions } from './span';
import { generateUUID } from '../utils/ids';

export class TraceManager {
  private static storage = new AsyncLocalStorage<Span>();
  private static activeSpans = new Map<string, Span>();

  public static startSpan(name: string, options?: SpanOptions): Span {
    // Read parent from AsyncLocalStorage context, not just activeSpans
    const parent = this.currentSpan();
    const traceId = options?.traceId || parent?.traceId || generateUUID();
    // If a parentId is explicitly given use it, otherwise inherit from
    // the current context span — this is what makes child spans work
    const parentId = options?.parentId !== undefined
      ? options.parentId
      : (parent?.id ?? null);

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
    this.activeSpans.set(span.id, span);
    return this.storage.run(span, () => {
      try {
        return callback();
      } finally {
        if (span.endTime !== null) {
          this.activeSpans.delete(span.id);
        }
      }
    });
  }

  // Convenience: start a span, run async work inside its context, end it
  public static async runWithSpanAsync<T>(
    name: string,
    callback: (span: Span) => Promise<T>,
    options?: SpanOptions
  ): Promise<T> {
    const span = this.startSpan(name, options);
    return this.storage.run(span, async () => {
      try {
        const result = await callback(span);
        span.end('ok');
        return result;
      } catch (err) {
        span.end('error');
        throw err;
      } finally {
        this.activeSpans.delete(span.id);
      }
    });
  }
}