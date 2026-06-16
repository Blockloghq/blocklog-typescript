# API Reference

This document provides a comprehensive reference for the Blocklog TypeScript SDK API.

## Table of Contents

- [BlocklogClient](#blocklogclient)
- [Configuration](#configuration)
- [Event Methods](#event-methods)
- [Lifecycle Methods](#lifecycle-methods)
- [API Clients](#api-clients)
- [Decorators](#decorators)
- [Tracing](#tracing)
- [Integrations](#integrations)
- [Error Classes](#error-classes)

## BlocklogClient

The main client class for interacting with the Blocklog API.

### Constructor

```typescript
new BlocklogClient(config: BlocklogConfig, dependencies?: ClientDependencies)
```

**Parameters:**

- `config` - Configuration object
- `dependencies` - Optional dependency injection overrides

**Example:**

```typescript
const client = new BlocklogClient({
  apiKey: 'your-api-key',
  endpoint: 'base_url',
  batchSize: 100,
  flushInterval: 5000
});
```

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `config` | `ResolvedConfig` | Resolved configuration |
| `transport` | `SyncTransport` | HTTP transport layer |
| `processor` | `EventProcessor` | Event processing pipeline |
| `traceManager` | `typeof TraceManager` | Tracing manager |
| `buffer` | `EventBuffer` | Event buffer |
| `memoryQueue` | `MemoryQueue` | In-memory queue |
| `persistentQueue` | `PersistentQueue` | Persistent queue |
| `deadLetterQueue` | `DeadLetterQueue` | Dead letter queue |
| `decisions` | `DecisionsClient` | Decisions API client |
| `traces` | `TracesClient` | Traces API client |
| `approvals` | `ApprovalClient` | Approvals API client |
| `incidents` | `IncidentsClient` | Incidents API client |
| `compliance` | `ComplianceClient` | Compliance API client |
| `replay` | `ReplayClient` | Replay API client |
| `forensics` | `ReplayClient` | Alias for replay client |
| `hitl` | `ApprovalClient` | Alias for approval client |

## Configuration

### BlocklogConfig

```typescript
interface BlocklogConfig {
  apiKey: string;
  endpoint?: string;
  batchSize?: number;
  flushInterval?: number;
  timeout?: number;
  retryCount?: number;
  enableSigning?: boolean;
  signingKey?: string;
  signingAlg?: 'hmac-sha256' | 'ed25519';
  enableCompression?: boolean;
  debug?: boolean;
}
```

### ResolvedConfig

```typescript
interface ResolvedConfig {
  apiKey: string;
  endpoint: string;
  batchSize: number;
  flushInterval: number;
  timeout: number;
  retryCount: number;
  enableSigning: boolean;
  signingKey?: string;
  signingAlg: 'hmac-sha256' | 'ed25519';
  enableCompression: boolean;
  debug: boolean;
}
```

## Event Methods

### event()

Send a single event to the Blocklog API.

```typescript
event(eventType: string, payload: any, options?: EventOptions): Promise<IngestResponse>
```

**Parameters:**

- `eventType` - Event type identifier
- `payload` - Event payload data
- `options` - Optional event options

**Returns:** `Promise<IngestResponse>`

**Example:**

```typescript
await client.event('AGENT_RUN', {
  agent_id: 'my-agent',
  input: 'test input',
  output: 'test output'
});
```

### enqueue()

Enqueue an event for batch processing.

```typescript
enqueue(eventType: string, payload: any, options?: EventOptions): Promise<IngestResponse | null>
```

**Parameters:**

- `eventType` - Event type identifier
- `payload` - Event payload data
- `options` - Optional event options

**Returns:** `Promise<IngestResponse | null>` - Returns null if event is buffered

**Example:**

```typescript
await client.enqueue('TOOL_CALL', {
  tool_name: 'calculator',
  input: '2 + 2',
  output: '4'
});
```

### addHook()

Add a middleware hook to transform events.

```typescript
addHook(hook: MiddlewareHook): BlocklogClient
```

**Parameters:**

- `hook` - Middleware hook function

**Returns:** `BlocklogClient` - Returns client for chaining

**Example:**

```typescript
client.addHook((event) => {
  event.metadata = { ...event.metadata, enriched: true };
  return event;
});
```

## Lifecycle Methods

### flush()

Flush all buffered events to the API.

```typescript
flush(): Promise<IngestResponse>
```

**Returns:** `Promise<IngestResponse>`

**Example:**

```typescript
await client.flush();
```

### shutdown()

Gracefully shutdown the client, flushing all events and cleaning up resources.

```typescript
shutdown(): Promise<void>
```

**Returns:** `Promise<void>`

**Example:**

```typescript
await client.shutdown();
```

### health()

Check the health status of the client.

```typescript
health(): Promise<HealthStatus>
```

**Returns:** `Promise<HealthStatus>`

**Example:**

```typescript
const health = await client.health();
console.log(health);
// { healthy: true, queueDepth: 0, pendingEvents: 0, transportReady: true }
```

## API Clients

### DecisionsClient

Manages decision records.

```typescript
client.decisions.create(data: Record<string, any>): Promise<any>
client.decisions.get(id: string): Promise<any>
client.decisions.list(params?: Record<string, any>): Promise<any>
client.decisions.search(query: Record<string, any>): Promise<any>
client.decisions.update(id: string, data: Record<string, any>): Promise<any>
client.decisions.verify(id: string): Promise<any>
```

### TracesClient

Manages trace records.

```typescript
client.traces.get(id: string): Promise<any>
client.traces.list(params?: Record<string, any>): Promise<any>
client.traces.getTimeline(id: string): Promise<any>
```

### ApprovalClient

Manages approval workflows.

```typescript
client.approvals.create(data: Record<string, any>): Promise<any>
client.approvals.approve(id: string, reason?: string): Promise<any>
client.approvals.reject(id: string, reason?: string): Promise<any>
client.approvals.status(id: string): Promise<any>
client.approvals.list(params?: Record<string, any>): Promise<any>
```

### IncidentsClient

Manages incident records.

```typescript
client.incidents.create(data: Record<string, any>): Promise<any>
client.incidents.get(id: string): Promise<any>
client.incidents.update(id: string, data: Record<string, any>): Promise<any>
client.incidents.list(params?: Record<string, any>): Promise<any>
client.incidents.assign(id: string, assignee: string): Promise<any>
client.incidents.resolve(id: string, reason: string): Promise<any>
client.incidents.close(id: string, reason: string): Promise<any>
```

### ComplianceClient

Manages compliance operations.

```typescript
client.compliance.audit(data: Record<string, any>): Promise<any>
client.compliance.verify(id: string): Promise<any>
client.compliance.export(data: Record<string, any>): Promise<any>
client.compliance.getReport(id: string): Promise<any>
client.compliance.getDashboard(params?: Record<string, any>): Promise<any>
client.compliance.shareReport(id: string, emails: string[]): Promise<any>
client.compliance.exportEvidence(id: string, format: string): Promise<any>
```

### ReplayClient

Manages replay operations.

```typescript
client.replay.reconstruct(traceId: string, options?: Record<string, any>): Promise<any>
client.replay.verify(id: string): Promise<any>
client.replay.replay(id: string, options?: Record<string, any>): Promise<any>
client.replay.get(id: string): Promise<any>
client.replay.list(params?: Record<string, any>): Promise<any>
client.replay.compare(idA: string, idB: string): Promise<any>
```

## Decorators

### @traceAgent

Decorator for automatic agent tracing.

```typescript
@traceAgent(options: AgentOptions | string)
```

**Parameters:**

- `options` - Agent options or agent name string

**Example:**

```typescript
class MyAgent {
  @traceAgent('my-agent')
  async execute(input: string): Promise<string> {
    return `processed: ${input}`;
  }
}
```

### executeAgent()

Function for agent tracing without decorators.

```typescript
executeAgent<T>(agentId: string, fn: () => Promise<T>, options?: AgentOptions): Promise<T>
```

**Parameters:**

- `agentId` - Agent identifier
- `fn` - Function to execute
- `options` - Optional agent options

**Returns:** `Promise<T>` - Result of the function

**Example:**

```typescript
const result = await executeAgent('my-agent', async () => {
  return 'processed result';
}, { version: '1.0' });
```

## Tracing

### TraceManager

Static class for managing trace spans.

```typescript
TraceManager.startSpan(name: string, options?: SpanOptions): Span
TraceManager.endSpan(span: Span | string, status?: string): void
TraceManager.currentSpan(): Span | undefined
TraceManager.parentSpan(): Span | undefined
TraceManager.runWithSpan<T>(span: Span, fn: () => Promise<T>): Promise<T>
```

**Example:**

```typescript
const span = TraceManager.startSpan('my-operation');
const result = await TraceManager.runWithSpan(span, async () => {
  return 'result';
});
TraceManager.endSpan(span, 'success');
```

## Integrations

### instrumentLangChain()

Instrument LangChain for automatic tracing.

```typescript
instrumentLangChain(): LangChainTracer
```

**Returns:** `LangChainTracer`

**Example:**

```typescript
const tracer = instrumentLangChain();
tracer.handleChainStart({ name: 'my-chain' }, { input: 'test' }, 'run-id');
```

### instrumentLangGraph()

Instrument LangGraph for automatic tracing.

```typescript
instrumentLangGraph(): LangGraphHooks
```

**Returns:** `LangGraphHooks`

**Example:**

```typescript
const hooks = instrumentLangGraph();
hooks.onNodeStart('node-a', { input: 'test' }, 'run-id');
```

### instrumentOpenAIAgents()

Instrument OpenAI Agents for automatic tracing.

```typescript
instrumentOpenAIAgents(): OpenAIHooks
```

**Returns:** `OpenAIHooks`

**Example:**

```typescript
const hooks = instrumentOpenAIAgents();
hooks.onAgentRunStart('my-agent', { input: 'test' });
```

## Error Classes

### ApiError

Base API error class.

```typescript
class ApiError extends BlocklogError {
  statusCode: number;
  errorCode: string;
  details?: any;
}
```

### AuthenticationError

Authentication error (401, 403).

```typescript
class AuthenticationError extends BlocklogAuthError
```

### RateLimitError

Rate limit error (429).

```typescript
class RateLimitError extends BlocklogError {
  retryAfter?: number;
}
```

### ValidationError

Validation error (400).

```typescript
class ValidationError extends BlocklogError {
  field?: string;
  value?: any;
}
```

### TransportError

Transport/network error.

```typescript
class TransportError extends BlocklogTransportError {
  statusCode: number;
  details?: string;
}
```

## Global Functions

### setGlobalClient()

Set the global client for decorator usage.

```typescript
setGlobalClient(client: BlocklogClient): void
```

**Example:**

```typescript
const client = new BlocklogClient({ apiKey: 'your-api-key' });
setGlobalClient(client);
```

### getGlobalClient()

Get the global client.

```typescript
getGlobalClient(): BlocklogClient | null
```

**Returns:** `BlocklogClient | null`

**Example:**

```typescript
const client = getGlobalClient();
if (client) {
  await client.event('TEST_EVENT', {});
}
```

## Type Definitions

### IngestResponse

```typescript
interface IngestResponse {
  ingested: number;
  log_ids: string[];
}
```

### HealthStatus

```typescript
interface HealthStatus {
  healthy: boolean;
  queueDepth: number;
  pendingEvents: number;
  transportReady: boolean;
}
```

### EventOptions

```typescript
interface EventOptions {
  metadata?: Record<string, any>;
  trace_id?: string;
  span_id?: string;
  timestamp?: string;
}
```

### AgentOptions

```typescript
interface AgentOptions {
  name?: string;
  version?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}
```

### SpanOptions

```typescript
interface SpanOptions {
  metadata?: Record<string, any>;
  tags?: string[];
  attributes?: Record<string, any>;
}
```

## Related Documentation

- [Configuration Guide](configuration.md) - Configuration options
- [Feature Guides](guides/) - Feature-specific guides
- [Integration Guides](integrations/) - Framework integrations
