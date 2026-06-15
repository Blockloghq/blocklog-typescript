# Architecture

This document describes the architecture of the Blocklog TypeScript SDK.

## Overview

The Blocklog TypeScript SDK is designed as a lightweight orchestration layer that coordinates various subsystems for AI agent observability and compliance. The architecture emphasizes modularity, type safety, and production reliability.

## Core Components

### BlocklogClient

The `BlocklogClient` is the main entry point and orchestration layer. It coordinates all subsystems but contains minimal business logic itself.

```typescript
export class BlocklogClient {
  readonly config: ResolvedConfig;
  readonly transport: SyncTransport;
  readonly processor: EventProcessor;
  readonly traceManager: typeof TraceManager;
  readonly buffer: EventBuffer;
  readonly memoryQueue: MemoryQueue;
  readonly persistentQueue: PersistentQueue;
  readonly deadLetterQueue: DeadLetterQueue;
  
  // API clients
  readonly decisions: DecisionsClient;
  readonly traces: TracesClient;
  readonly approvals: ApprovalClient;
  readonly incidents: IncidentsClient;
  readonly compliance: ComplianceClient;
  readonly replay: ReplayClient;
}
```

### Subsystem Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    BlocklogClient                            │
│  (Lightweight Orchestration Layer)                          │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Config     │    │  TraceManager│    │ EventProcessor│
└──────────────┘    └──────────────┘    └──────────────┘
        │                     │                     │
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Validation  │    │   Spans      │    │  Middleware  │
│  & Defaults  │    │   & Context  │    │    Hooks     │
└──────────────┘    └──────────────┘    └──────────────┘
                              │                     │
                              └──────────┬──────────┘
                                         ▼
                              ┌──────────────┐
                              │   Pipeline    │
                              │  (Buffer +    │
                              │   Queue)      │
                              └──────────────┘
                                         │
                                         ▼
                              ┌──────────────┐
                              │  Transport   │
                              │  (HTTP +      │
                              │   Retry)      │
                              └──────────────┘
```

## Component Details

### Configuration Layer

**Location:** `src/config/`

The configuration layer handles:
- Environment variable resolution
- Schema validation using Zod
- Default value application
- Type-safe configuration access

```typescript
export interface BlocklogConfig {
  apiKey: string;
  endpoint?: string;
  batchSize?: number;
  flushInterval?: number;
  // ... other options
}

export function resolveConfig(config: BlocklogConfig): ResolvedConfig
```

### Tracing Infrastructure

**Location:** `src/tracing/`

The tracing infrastructure provides distributed tracing capabilities:

- **TraceManager**: Static class managing span lifecycle
- **Span**: Represents a single trace span with metadata
- **Async Local Storage**: Context propagation across async operations

```typescript
export class TraceManager {
  static startSpan(name: string, options?: SpanOptions): Span
  static endSpan(span: Span | string, status?: string): void
  static currentSpan(): Span | undefined
  static parentSpan(): Span | undefined
  static runWithSpan<T>(span: Span, fn: () => Promise<T>): Promise<T>
}
```

### Event Pipeline

**Location:** `src/pipeline/`

The central event pipeline processes all events:

- **EventProcessor**: Core processing logic with middleware hooks
- **EventBuffer**: Batches events for efficient transmission
- **Middleware Hooks**: Transform and enrich events

```typescript
export class EventProcessor {
  addHook(hook: MiddlewareHook): void
  processEvent(eventType: string, payload: any, options?: ProcessOptions): Promise<IngestResponse>
  flush(): Promise<IngestResponse>
  shutdown(): void
}
```

### Queue Layer

**Location:** `src/queue/`

The queue layer provides reliable event delivery:

- **MemoryQueue**: In-memory queue for fast access
- **PersistentQueue**: Disk-backed queue for durability
- **DeadLetterQueue**: Failed event storage

```typescript
export class MemoryQueue {
  enqueue(item: EventEnvelope): Promise<void>
  dequeue(count: number): Promise<EventEnvelope[]>
  peek(count: number): Promise<EventEnvelope[]>
  clear(): Promise<void>
}

export class PersistentQueue {
  enqueue(item: EventEnvelope): Promise<void>
  dequeue(count: number): Promise<EventEnvelope[]>
  // Persists to disk on each operation
}

export class DeadLetterQueue {
  add(event: EventEnvelope, reason: string): Promise<void>
  getEntries(): Promise<DeadLetterEntry[]>
  clear(): Promise<void>
}
```

### Transport Layer

**Location:** `src/transport/`

The transport layer handles HTTP communication:

- **SyncTransport**: HTTP client with authentication and error handling
- **Retry Logic**: Automatic retry with exponential backoff
- **Error Mapping**: HTTP status code to error type mapping

```typescript
export class SyncTransport {
  request(method: string, path: string, options?: RequestOptions): Promise<any>
}
```

### Signing Layer

**Location:** `src/signing/`

The signing layer provides event integrity:

- **Canonicalization**: Consistent event serialization
- **Hashing**: SHA-256 hash generation
- **Signing**: HMAC-SHA256 and Ed25519 signature generation

```typescript
export function canonicalize(data: any): string
export function hashSignHmac(payload: any, privateKey: string): string
export function hashSignEd25519(payload: any, privateKey: string): string
```

### Error Model

**Location:** `src/errors/`

The error model provides structured error handling:

```typescript
export class ApiError extends BlocklogError
export class AuthenticationError extends BlocklogAuthError
export class RateLimitError extends BlocklogError
export class ValidationError extends BlocklogError
export class TransportError extends BlocklogTransportError
```

### API Clients

**Location:** `src/api/`

Type-safe API clients for advanced operations:

- **DecisionsClient**: Decision management
- **TracesClient**: Trace retrieval and analysis
- **ApprovalClient**: Human-in-the-loop workflows
- **IncidentsClient**: Incident management
- **ComplianceClient**: Compliance reporting
- **ReplayClient**: Trace replay and debugging

```typescript
export class DecisionsClient extends BaseClient {
  create(data: Record<string, any>): Promise<any>
  get(id: string): Promise<any>
  list(params?: Record<string, any>): Promise<any>
  search(query: Record<string, any>): Promise<any>
  update(id: string, data: Record<string, any>): Promise<any>
  verify(id: string): Promise<any>
}
```

### Decorators

**Location:** `src/decorators/`

Decorators for automatic instrumentation:

- **@agent**: Agent execution tracing
- **@tool**: Tool call instrumentation
- **Decision**: Decision workflow tracking

```typescript
export function traceAgent(options: AgentOptions | string)
export function executeAgent<T>(agentId: string, fn: () => Promise<T>, options?: AgentOptions): Promise<T>
```

### Integrations

**Location:** `src/integrations/`

Native integrations with popular frameworks:

- **LangChain**: Chain, tool, and LLM tracing
- **LangGraph**: Node and edge instrumentation
- **OpenAI Agents**: Agent run and message tracking

```typescript
export function instrumentLangChain(): LangChainTracer
export function instrumentLangGraph(): LangGraphHooks
export function instrumentOpenAIAgents(): OpenAIHooks
```

## Data Flow

### Event Ingestion Flow

```
1. User calls client.event() or decorator
   ↓
2. EventProcessor receives event
   ↓
3. Middleware hooks transform event
   ↓
4. Event is canonicalized and signed (if enabled)
   ↓
5. Event is added to buffer
   ↓
6. Buffer flushes when batch size reached
   ↓
7. Events are sent via Transport
   ↓
8. Retry logic handles failures
   ↓
9. Failed events go to DeadLetterQueue
```

### Trace Propagation Flow

```
1. TraceManager.startSpan() creates span
   ↓
2. Span is stored in Async Local Storage
   ↓
3. Child operations access parent span via context
   ↓
4. TraceManager.runWithSpan() maintains context
   ↓
5. TraceManager.endSpan() finalizes span
   ↓
6. Span metadata is included in events
```

## Lifecycle Management

### Initialization

```typescript
const client = new BlocklogClient({ apiKey: 'test' });
// 1. Resolve configuration
// 2. Initialize subsystems
// 3. Set up timers
// 4. Register global client
```

### Event Processing

```typescript
await client.event('AGENT_RUN', { data: 'test' });
// 1. Add to buffer
// 2. Apply middleware
// 3. Sign if enabled
// 4. Queue for transmission
```

### Flush

```typescript
await client.flush();
// 1. Flush pipeline
// 2. Flush buffer
// 3. Flush queues
// 4. Await transport completion
```

### Shutdown

```typescript
await client.shutdown();
// 1. Flush everything
// 2. Persist queue
// 3. Stop timers
// 4. Close transports
// 5. Prevent event loss
```

### Health Check

```typescript
const health = await client.health();
// Returns: {
//   healthy: boolean,
//   queueDepth: number,
//   pendingEvents: number,
//   transportReady: boolean
// }
```

## Dependency Injection

The SDK supports dependency injection for testing and customization:

```typescript
interface ClientDependencies {
  transport?: SyncTransport;
  retry?: RetryPolicy;
  buffer?: EventBuffer;
  processor?: EventProcessor;
  memoryQueue?: MemoryQueue;
  persistentQueue?: PersistentQueue;
  deadLetterQueue?: DeadLetterQueue;
}

const client = new BlocklogClient(config, dependencies);
```

## Error Handling Strategy

### Error Classification

- **4xx Client Errors**: No retry (except 429)
- **429 Rate Limit**: Retry with exponential backoff
- **5xx Server Errors**: Retry up to retryCount
- **Network Errors**: Retry up to retryCount
- **Validation Errors**: Immediate failure

### Error Recovery

- Failed events go to DeadLetterQueue
- Retry with exponential backoff
- Circuit breaker for persistent failures
- Graceful degradation

## Performance Considerations

### Batching

- Events are batched to reduce API calls
- Default batch size: 100 events
- Configurable based on use case

### Queueing

- Memory queue for fast access
- Persistent queue for durability
- Automatic queue management

### Async Processing

- Non-blocking event ingestion
- Background transmission
- Parallel processing where possible

## Security Considerations

### Event Signing

- Optional event signing for integrity
- HMAC-SHA256 and Ed25519 support
- Key management via configuration

### Transport Security

- HTTPS by default
- API key authentication
- Request/response validation

### Data Privacy

- No sensitive data in logs
- Configurable debug mode
- Secure key handling

## Testing Architecture

### Test Structure

```
tests/
├── api/           # API client tests
├── client/        # Client lifecycle tests
├── config/        # Configuration tests
├── context/       # Async context tests
├── crypto/        # Signing tests
├── decorators/    # Decorator tests
├── middleware/    # Middleware tests
├── pipeline/      # Event pipeline tests
├── queue/         # Queue tests
├── tracing/       # Tracing tests
├── transport/     # Transport tests
└── integrations/  # Integration tests
```

### Test Coverage

- Unit tests for all components
- Integration tests for workflows
- Mock backend for API tests
- Load tests for performance validation

## Extension Points

The SDK provides several extension points:

1. **Middleware Hooks**: Transform events
2. **Custom Transport**: Alternative HTTP clients
3. **Custom Queues**: Alternative queue implementations
4. **Custom Signers**: Alternative signing algorithms
5. **Custom Integrations**: Framework-specific instrumentation

## Next Steps

- [Feature Guides](guides/) - Explore specific features
- [Integration Guides](integrations/) - Integrate with popular frameworks
- [API Reference](api-reference.md) - Complete API documentation
