import { generateUUID } from '../utils/ids';
import { getCurrentTimestamp, getDurationMs, nowMs } from '../utils/timestamps';

export interface SpanOptions {
  traceId?: string;
  parentId?: string | null;
  metadata?: Record<string, any>;
}

export class Span {
  public id: string;
  public name: string;
  public traceId: string;
  public parentId: string | null;
  public startTime: number;
  public startTimestamp: string;
  public endTime: number | null = null;
  public endTimestamp: string | null = null;
  public durationMs: number | null = null;
  public status: 'ok' | 'error' | 'pending' = 'pending';
  public error: { type: string; message: string; stack?: string } | null = null;
  public metadata: Record<string, any>;

  constructor(name: string, options?: SpanOptions) {
    this.id = generateUUID();
    this.name = name;
    this.traceId = options?.traceId || generateUUID();
    this.parentId = options?.parentId || null;
    this.startTime = nowMs();
    this.startTimestamp = getCurrentTimestamp();
    this.metadata = options?.metadata || {};
  }

  public setMetadata(key: string, value: any): this {
    this.metadata[key] = value;
    return this;
  }

  public recordError(error: Error): this {
    this.status = 'error';
    this.error = {
      type: error.name || 'Error',
      message: error.message,
      stack: error.stack,
    };
    return this;
  }

  public end(status: 'ok' | 'error' = 'ok'): this {
    this.endTime = nowMs();
    this.endTimestamp = getCurrentTimestamp();
    this.durationMs = getDurationMs(this.startTime);
    this.status = status;
    return this;
  }
}
