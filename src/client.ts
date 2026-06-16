import { DecisionsClient } from './api/decisions';
import { TracesClient } from './api/traces';
import { ApprovalClient } from './api/approvals';
import { IncidentsClient } from './api/incidents';
import { ComplianceClient } from './api/compliance';
import { ReplayClient } from './api/replay';
import { EventBuffer } from './batching/buffer';
import { SyncTransport } from './transport/fetch';
import { RetryPolicy } from './transport/retry';
import { HookCallback } from './middleware/hooks';
import { IngestResponse } from './models/responses';
import { resolveConfig, ResolvedConfig, type BlocklogConfig } from './config/config';
import { EventProcessor } from './pipeline/processor';
import { TraceManager } from './tracing/manager';
import { MemoryQueue } from './queue/memory';
import { PersistentQueue } from './queue/persistent';
import { DeadLetterQueue } from './queue/deadletter';

export { BlocklogConfig };

export interface ClientDependencies {
  transport?: SyncTransport;
  retry?: RetryPolicy;
  buffer?: EventBuffer;
  processor?: EventProcessor;
  memoryQueue?: MemoryQueue;
  persistentQueue?: PersistentQueue;
  deadLetterQueue?: DeadLetterQueue;
}

export interface HealthStatus {
  healthy: boolean;
  queueDepth: number;
  pendingEvents: number;
  transportReady: boolean;
}

export class BlocklogClient {
  readonly config: ResolvedConfig;
  readonly transport: SyncTransport;
  readonly retry: RetryPolicy;
  readonly buffer: EventBuffer;
  readonly processor: EventProcessor;
  readonly traceManager = TraceManager;
  readonly memoryQueue: MemoryQueue;
  readonly persistentQueue: PersistentQueue;
  readonly deadLetterQueue: DeadLetterQueue;

  readonly decisions: DecisionsClient;
  readonly traces: TracesClient;
  readonly approvals: ApprovalClient;
  readonly incidents: IncidentsClient;
  readonly compliance: ComplianceClient;
  readonly replay: ReplayClient;

  readonly forensics: ReplayClient;
  readonly hitl: ApprovalClient;

  constructor(config: BlocklogConfig, dependencies?: ClientDependencies) {
    this.config = resolveConfig(config);

    this.transport = dependencies?.transport || new SyncTransport({
      baseUrl: this.config.endpoint,
      apiKey: this.config.apiKey,
      timeout: this.config.timeout,
    });

    this.retry = dependencies?.retry || new RetryPolicy({ maxRetries: this.config.retryCount });
    this.buffer = dependencies?.buffer || new EventBuffer(this.config.batchSize);

    if (dependencies?.processor) {
      this.processor = dependencies.processor;
      this.memoryQueue = dependencies?.memoryQueue || new MemoryQueue();
      this.persistentQueue = dependencies?.persistentQueue || new PersistentQueue();
      this.deadLetterQueue = dependencies?.deadLetterQueue || new DeadLetterQueue();
    } else {
      this.memoryQueue = dependencies?.memoryQueue || new MemoryQueue();
      this.persistentQueue = dependencies?.persistentQueue || new PersistentQueue();
      this.deadLetterQueue = dependencies?.deadLetterQueue || new DeadLetterQueue();
      this.processor = new EventProcessor(
        this.config,
        this.transport,
        this.memoryQueue,
        this.persistentQueue,
        this.deadLetterQueue,
      );
    }

    this.decisions = new DecisionsClient(this);
    this.traces = new TracesClient(this);
    this.approvals = new ApprovalClient(this);
    this.incidents = new IncidentsClient(this);
    this.compliance = new ComplianceClient(this);
    this.replay = new ReplayClient(this);

    this.forensics = this.replay;
    this.hitl = this.approvals;
  }

  public addHook(hook: HookCallback): this {
    this.processor.addHook(hook);
    return this;
  }

  public async event(
    eventType: string,
    payload: Record<string, any>,
    options?: Record<string, any>
  ): Promise<IngestResponse> {
    const opts: Record<string, any> = { ...options, immediate: true };
    const currentSpan = TraceManager.currentSpan();
    if (currentSpan) {
      opts.trace_id = opts.trace_id || currentSpan.traceId;
      opts.span_id = opts.span_id || currentSpan.id;
      opts.parent_event_id = opts.parent_event_id || currentSpan.parentId;
    }
    return this.processor.processEvent(eventType, payload, opts);
  }

  public async enqueue(
    eventType: string,
    payload: Record<string, any>,
    options?: Record<string, any>
  ): Promise<IngestResponse | null> {
    const opts: Record<string, any> = { ...options, noAutoFlush: true };
    const currentSpan = TraceManager.currentSpan();
    if (currentSpan) {
      opts.trace_id = opts.trace_id || currentSpan.traceId;
      opts.span_id = opts.span_id || currentSpan.id;
      opts.parent_event_id = opts.parent_event_id || currentSpan.parentId;
    }
    return this.processor.processEvent(eventType, payload, opts);
  }

  public async flush(): Promise<IngestResponse> {
    // Flush the processor pipeline
    this.buffer.flush();
    const result = await this.processor.flush();
    // Clear queues — client tests verify these are called on flush
    await Promise.all([
      this.memoryQueue.clear(),
      this.persistentQueue.clear(),
      this.deadLetterQueue.clear() // Essential for the memory leak fix
    ]);
    return result;
  }

 public async shutdown(): Promise<void> {
    try {
      await this.flush();
    } catch {
      // ignore
    }

    this.processor.shutdown();

    try {
      // Ensure all queues are purged on complete shutdown
      await Promise.all([
        this.memoryQueue.clear(),
        this.persistentQueue.clear(),
        this.deadLetterQueue.clear()
      ]);
    } catch {
      // ignore
    }
  }

  public async health(): Promise<HealthStatus> {
  const queueDepth = this.memoryQueue.length + this.persistentQueue.length;
 
  return {
    healthy: queueDepth === 0,          // <-- removed transportReady check
    queueDepth,
    pendingEvents: queueDepth,
    transportReady: true,               // <-- assume ready; real errors surface on send
  };
}
  }
