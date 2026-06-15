# Blocklog TypeScript SDK

The official TypeScript SDK for Blocklog - production-grade observability and compliance for AI agents.

## Features

- **Agent Tracing**: Automatic instrumentation for AI agent workflows
- **Decision Recording**: Track and audit AI decision-making processes
- **Human-in-the-Loop**: Built-in approval workflows for critical decisions
- **Incident Management**: Track and resolve AI incidents
- **Compliance**: Automated compliance reporting and evidence export
- **Replay & Debug**: Reconstruct and replay agent executions
- **Integrations**: Native support for LangChain, LangGraph, and OpenAI Agents
- **Type-Safe**: Full TypeScript support with comprehensive types
- **Production-Ready**: Built-in retry logic, queueing, and error handling

## Installation

```bash
npm install @blocklog/sdk
```

## Quick Start

```typescript
import { BlocklogClient } from '@blocklog/sdk';

const client = new BlocklogClient({
  apiKey: 'your-api-key',
  endpoint: 'https://api.blocklog.ai',
});

// Track an agent execution
await client.event('AGENT_RUN', {
  agent_id: 'my-agent',
  input: 'user input',
  output: 'agent response',
});

// Clean shutdown
await client.shutdown();
```

## Documentation

- [Installation Guide](docs/installation.md)
- [Quick Start Guide](docs/quickstart.md)
- [Configuration](docs/configuration.md)
- [Architecture](docs/architecture.md)
- [Feature Guides](docs/guides/)
- [Integration Guides](docs/integrations/)
- [API Reference](docs/api-reference.md)

## Core Concepts

### Event Types

The SDK tracks several event types:

- `AGENT_RUN` - Agent execution lifecycle
- `TOOL_CALL` - Tool/function invocations
- `DECISION` - Decision points in agent workflows
- `APPROVAL` - Human-in-the-loop approval requests
- `INCIDENT` - AI incidents and resolutions
- `COMPLIANCE` - Compliance audit events

### Client Architecture

The `BlocklogClient` is a lightweight orchestration layer that coordinates:

- **Config**: Configuration management with environment variable support
- **TraceManager**: Distributed tracing with async context propagation
- **EventProcessor**: Central event pipeline with middleware hooks
- **Queue**: Memory and persistent queueing for reliability
- **Transport**: HTTP transport with retry logic and error handling
- **API Clients**: Type-safe clients for Decisions, Traces, Approvals, Incidents, Compliance, and Replay

## Usage Examples

### Basic Agent Tracing

```typescript
import { BlocklogClient } from '@blocklog/sdk';

const client = new BlocklogClient({ apiKey: 'your-api-key' });

// Track agent execution
await client.event('AGENT_RUN', {
  agent_id: 'my-agent',
  input: 'What is the weather?',
  output: 'The weather is sunny',
});

await client.shutdown();
```

### Using Decorators

```typescript
import { traceAgent } from '@blocklog/sdk';

class MyAgent {
  @traceAgent('weather-agent')
  async getWeather(location: string) {
    // Your agent logic here
    return 'sunny';
  }
}
```

### LangChain Integration

```typescript
import { BlocklogClient } from '@blocklog/sdk';

const client = new BlocklogClient({ apiKey: 'your-api-key' });
const tracer = client.instrumentLangChain();

// LangChain will automatically emit events
```

### Error Handling

```typescript
import { BlocklogClient, ApiError, AuthenticationError } from '@blocklog/sdk';

const client = new BlocklogClient({ apiKey: 'your-api-key' });

try {
  await client.event('AGENT_RUN', { data: 'test' });
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error('Authentication failed');
  } else if (error instanceof ApiError) {
    console.error(`API Error: ${error.message}`);
  }
}
```

## Lifecycle Management

The SDK provides lifecycle methods for proper resource management:

```typescript
// Flush pending events
await client.flush();

// Check health status
const health = await client.health();
console.log(health); // { healthy: true, queueDepth: 0, pendingEvents: 0, transportReady: true }

// Graceful shutdown
await client.shutdown();
```

## Configuration

Configuration can be provided via constructor or environment variables:

```typescript
const client = new BlocklogClient({
  apiKey: 'your-api-key',
  endpoint: 'https://api.blocklog.ai',
  batchSize: 100,
  flushInterval: 5000,
  enableSigning: true,
  debug: false,
});
```

Environment variables:
- `BLOCKLOG_API_KEY` - Your API key
- `BLOCKLOG_ENDPOINT` - API endpoint URL
- `BLOCKLOG_BATCH_SIZE` - Event batch size
- `BLOCKLOG_FLUSH_INTERVAL` - Auto-flush interval (ms)
- `BLOCKLOG_ENABLE_SIGNING` - Enable event signing
- `BLOCKLOG_DEBUG` - Enable debug logging

## API Clients

The SDK includes type-safe API clients for advanced operations:

```typescript
// Decisions
await client.decisions.create({ type: 'approval', data: {} });
await client.decisions.get('decision-id');
await client.decisions.list({ limit: 10 });
await client.decisions.search({ query: 'test' });

// Traces
await client.traces.get('trace-id');
await client.traces.list({ limit: 10 });
await client.traces.getTimeline('trace-id');

// Approvals
await client.approvals.create({ decisionId: '123', reason: 'Needs review' });
await client.approvals.approve('approval-id', 'Approved');
await client.approvals.reject('approval-id', 'Rejected');
await client.approvals.status('approval-id');

// Incidents
await client.incidents.create({ title: 'Critical error' });
await client.incidents.get('incident-id');
await client.incidents.resolve('incident-id', 'Fixed');

// Compliance
await client.compliance.audit({ startDate: '2024-01-01' });
await client.compliance.verify('audit-id');
await client.compliance.export({ format: 'pdf' });

// Replay
await client.replay.reconstruct('trace-id');
await client.replay.verify('replay-id');
await client.replay.replay('replay-id', { speed: 2 });
```

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build

# Lint
npm run lint
```

## License

MIT

## Support

- Documentation: [docs/](docs/)
- Issues: [GitHub Issues](https://github.com/blocklog/blocklog-typescript/issues)
- Email: support@blocklog.ai
