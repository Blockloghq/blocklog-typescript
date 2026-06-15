import { ResolvedConfig } from '../config/config';
import { SyncTransport } from '../transport/fetch';
import { MemoryQueue } from '../queue/memory';
import { PersistentQueue } from '../queue/persistent';
import { DeadLetterQueue } from '../queue/deadletter';
import { EventEnvelope } from '../models/events';
import { canonicalize } from '../utils/serialization';
import { hashSignHmac, hashSignEd25519 } from '../signing/crypto';
import { generateIdempotencyKey } from '../utils/ids';
import { EventEmitter } from './emitter';
import { IngestResponse } from '../models/responses';
import { createHash } from 'crypto';

export class EventProcessor {
  private config: ResolvedConfig;
  private transport: SyncTransport;
  private memoryQueue: MemoryQueue;
  private persistentQueue: PersistentQueue;
  private dlq: DeadLetterQueue;
  private hooks: ((payload: Record<string, any>) => Record<string, any>)[] = [];
  public emitter: EventEmitter;
  private flushTimer: NodeJS.Timeout | null = null;

  constructor(config: ResolvedConfig, transport: SyncTransport) {
    this.config = config;
    this.transport = transport;
    this.memoryQueue = new MemoryQueue();
    this.persistentQueue = new PersistentQueue();
    this.dlq = new DeadLetterQueue();
    this.emitter = new EventEmitter();

    // Start flush interval if flushInterval is set
    if (this.config.flushInterval > 0) {
      this.startFlushTimer();
    }

    // Recover outstanding persistent queue items
    this.recoverPersistentEvents();
  }

  private startFlushTimer() {
    this.flushTimer = setInterval(() => {
      this.flush().catch(() => {});
    }, this.config.flushInterval);
    if (this.flushTimer.unref) {
      this.flushTimer.unref();
    }
  }

  private async recoverPersistentEvents() {
    const len = this.persistentQueue.length;
    if (len > 0) {
      const items = await this.persistentQueue.peek(len);
      await this.memoryQueue.enqueueBatch(items);
    }
  }

  public addHook(hook: (payload: Record<string, any>) => Record<string, any>): void {
    this.hooks.push(hook);
  }

  public async processEvent(eventType: string, payload: Record<string, any>, options?: Record<string, any>): Promise<any> {
    const envelope = this.buildEnvelope(eventType, payload, options);
    
    // Run middleware hooks
    let processedPayload: any = { ...envelope };
    for (const hook of this.hooks) {
      processedPayload = hook(processedPayload) as any;
    }

    // Canonicalization, hashing, signing
    if (this.config.enableSigning && this.config.signingKey) {
      const payloadData = processedPayload.payload;
      if (this.config.signingAlg === 'hmac-sha256') {
        processedPayload.log_signature = hashSignHmac(processedPayload, this.config.signingKey);
      } else {
        processedPayload.log_signature = hashSignEd25519(processedPayload, this.config.signingKey);
      }
    }

    await this.emitter.emit('event:processed', processedPayload);

    // If immediate send is requested
    if (options?.immediate) {
      return this.sendImmediate(processedPayload);
    }

    // Queue the event
    await this.memoryQueue.enqueue(processedPayload);
    await this.persistentQueue.enqueue(processedPayload);

    // If batch size is reached, flush immediately
    if (this.memoryQueue.length >= this.config.batchSize) {
      return this.flush();
    }

    return null;
  }

  private buildEnvelope(eventType: string, payload: Record<string, any>, options?: Record<string, any>): EventEnvelope {
    const envelope: EventEnvelope = {
      event_type: eventType,
      payload,
      source: options?.source || 'typescript-sdk',
      timestamp: new Date().toISOString(),
      trace_id: options?.trace_id || null,
      session_id: options?.session_id || null,
      workflow_id: options?.workflow_id || null,
      agent_id: options?.agent_id || null,
      parent_event_id: options?.parent_event_id || null,
      root_event_id: options?.root_event_id || null,
      span_id: options?.span_id || null,
      attempt_no: options?.attempt_no || 1,
      causality_type: options?.causality_type || null,
      schema_version: '1.0',
      event_version: '1.0',
      agent_metadata: options?.agent_metadata || {},
    };

    if (!envelope.idempotency_key) {
      const digestBase = `${envelope.event_type}:${envelope.source}:${envelope.trace_id}:${envelope.session_id}:${JSON.stringify(envelope.payload)}`;
      envelope.idempotency_key = `blk_${createHash('sha256').update(digestBase).digest('hex').substring(0, 32)}`;
    }

    return envelope;
  }

  private async sendImmediate(envelope: EventEnvelope): Promise<IngestResponse> {
    let attempts = 0;
    let lastError: any = null;

    while (attempts <= this.config.retryCount) {
      try {
        const response = await this.transport.request('POST', '/logs', { json: envelope });
        return response;
      } catch (err: any) {
        attempts++;
        lastError = err;
        if (attempts <= this.config.retryCount) {
          // simple delay before retry
          await new Promise(resolve => setTimeout(resolve, attempts * 200));
        }
      }
    }

    await this.dlq.add(envelope, lastError?.message || 'Failed after max retries');
    throw lastError;
  }

  public async flush(): Promise<IngestResponse> {
    const items = await this.memoryQueue.peek(this.config.batchSize);
    if (items.length === 0) {
      return { ingested: 0, log_ids: [] };
    }

    let attempts = 0;
    let lastError: any = null;
    const body = { logs: items };

    while (attempts <= this.config.retryCount) {
      try {
        const response = await this.transport.request('POST', '/logs/batch', { json: body });
        
        // Success: dequeue and persist changes
        await this.memoryQueue.dequeue(items.length);
        await this.persistentQueue.dequeue(items.length);
        return response;
      } catch (err: any) {
        attempts++;
        lastError = err;
        if (attempts <= this.config.retryCount) {
          await new Promise(resolve => setTimeout(resolve, attempts * 200));
        }
      }
    }

    // On permanent failure, move all to DLQ, and remove from active queues
    for (const item of items) {
      await this.dlq.add(item, lastError?.message || 'Batch send failed');
    }
    await this.memoryQueue.dequeue(items.length);
    await this.persistentQueue.dequeue(items.length);

    throw lastError;
  }

  public shutdown() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }
}
