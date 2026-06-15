import { Span } from './span';

export class Trace {
  public traceId: string;
  public spans: Map<string, Span> = new Map();

  constructor(traceId: string) {
    this.traceId = traceId;
  }

  public addSpan(span: Span): void {
    this.spans.set(span.id, span);
  }

  public getSpan(spanId: string): Span | undefined {
    return this.spans.get(spanId);
  }

  public getSpans(): Span[] {
    return Array.from(this.spans.values());
  }

  public getRootSpan(): Span | undefined {
    return this.getSpans().find(span => !span.parentId);
  }

  public getChildSpans(spanId: string): Span[] {
    return this.getSpans().filter(span => span.parentId === spanId);
  }
}
