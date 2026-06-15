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
import { EventEnvelope } from './models/events';
import { IngestResponse } from './models/responses';
import { resolveConfig, ResolvedConfig, BlocklogConfig } from './config/config';
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

  // Sub-clients
  readonly decisions: DecisionsClient;
  readonly traces: TracesClient;
  readonly approvals: ApprovalClient;
  readonly incidents: IncidentsClient;
  readonly compliance: ComplianceClient;
  readonly replay: ReplayClient;
  
  // Aliases
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
    this.memoryQueue = dependencies?.memoryQueue || new MemoryQueue();
    this.persistentQueue = dependencies?.persistentQueue || new PersistentQueue();
    this.deadLetterQueue = dependencies?.deadLetterQueue || new DeadLetterQueue();

    this.processor = dependencies?.processor || new EventProcessor(this.config, this.transport);

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

  public async event(eventType: string, payload: Record<string, any>, options?: Record<string, any>): Promise<IngestResponse> {
    const opts: Record<string, any> = { ...options, immediate: true };
    const currentSpan = TraceManager.currentSpan();
    if (currentSpan) {
      opts.trace_id = opts.trace_id || currentSpan.traceId;
      opts.span_id = opts.span_id || currentSpan.id;
      opts.parent_event_id = opts.parent_event_id || currentSpan.parentId;
    }
    return this.processor.processEvent(eventType, payload, opts);
  }

  public async enqueue(eventType: string, payload: Record<string, any>, options?: Record<string, any>): Promise<IngestResponse | null> {
    const opts: Record<string, any> = { ...options };
    const currentSpan = TraceManager.currentSpan();
    if (currentSpan) {
      opts.trace_id = opts.trace_id || currentSpan.traceId;
      opts.span_id = opts.span_id || currentSpan.id;
      opts.parent_event_id = opts.parent_event_id || currentSpan.parentId;
    }
    return this.processor.processEvent(eventType, payload, opts);
  }

  public async flush(): Promise<IngestResponse> {
    // Flush pipeline
    const result = await this.processor.flush();
    
    // Flush buffer
    this.buffer.flush();
    
    // Flush queues
    await this.memoryQueue.clear();
    await this.persistentQueue.clear();
    
    return result;
  }

  public async shutdown(): Promise<void> {
    // Flush everything
    await this.flush();
    
    // Persist queue (already persisted by PersistentQueue on each operation)
    // No explicit flush needed as it saves to disk on each enqueue/dequeue
    
    // Stop timers
    this.processor.shutdown();
    
    // Prevent event loss by ensuring all queues are cleared
    await this.memoryQueue.clear();
  }

  public async health(): Promise<HealthStatus> {
    const queueDepth = this.memoryQueue.length + this.persistentQueue.length;
    const pendingEvents = queueDepth;
    
    // Check transport readiness by attempting a lightweight request
    let transportReady = false;
    try {
      await this.transport.request('GET', '/health');
      transportReady = true;
    } catch {
      transportReady = false;
    }

    return {
      healthy: transportReady && queueDepth === 0,
      queueDepth,
      pendingEvents,
      transportReady,
    };
  }
}
