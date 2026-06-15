# Agent Tracing Guide

This guide covers how to trace AI agent executions using the Blocklog TypeScript SDK.

## Overview

Agent tracing provides complete visibility into AI agent executions, including:
- Agent lifecycle events (start, end, error)
- Input/output tracking
- Performance metrics
- Error handling
- Trace context propagation

## Using Decorators

The simplest way to trace agents is using the `@traceAgent` decorator:

```typescript
import { traceAgent } from '@blocklog/sdk';

class WeatherAgent {
  @traceAgent('weather-agent')
  async getWeather(location: string): Promise<string> {
    // Your agent logic here
    const response = await fetch(`https://api.weather.com/${location}`);
    const data = await response.json();
    return data.weather;
  }
}
```

### Decorator Options

```typescript
@traceAgent({
  name: 'my-agent',
  version: '1.0',
  tags: ['production', 'critical'],
  metadata: {
    environment: 'prod',
    team: 'ai-team'
  }
})
async execute(input: string): Promise<string> {
  // Agent logic
}
```

## Using executeAgent Function

For more control, use the `executeAgent` function:

```typescript
import { executeAgent } from '@blocklog/sdk';

const result = await executeAgent(
  'my-agent',
  async () => {
    // Your agent logic here
    return 'agent result';
  },
  {
    version: '1.0',
    tags: ['test'],
    metadata: { custom: 'value' }
  }
);
```

## Automatic Events

The SDK automatically emits these events for agent executions:

- `AGENT_START` - Agent execution started
- `AGENT_COMPLETE` - Agent execution completed successfully
- `AGENT_ERROR` - Agent execution failed

## Trace Context

Agent traces automatically include:
- **Trace ID**: Unique identifier for the entire trace
- **Span ID**: Unique identifier for this agent execution
- **Parent Span ID**: Parent span if this is a nested agent
- **Agent Metadata**: Agent name, version, tags, and custom metadata

## Nested Agents

Trace context automatically propagates to nested agent calls:

```typescript
class ParentAgent {
  @traceAgent('parent-agent')
  async execute(input: string): Promise<string> {
    const childAgent = new ChildAgent();
    return await childAgent.process(input); // Automatically inherits trace context
  }
}

class ChildAgent {
  @traceAgent('child-agent')
  async process(input: string): Promise<string> {
    // This will have the same trace ID as parent
    return `processed: ${input}`;
  }
}
```

## Error Handling

Agent errors are automatically captured and traced:

```typescript
class ErrorAgent {
  @traceAgent('error-agent')
  async execute(input: string): Promise<string> {
    throw new Error('Agent failed');
  }
}

// This will emit AGENT_ERROR event with error details
```

## Performance Metrics

Agent executions automatically track:
- **Duration**: Execution time in milliseconds
- **Timestamps**: Start and end times
- **Status**: Success or failure

## Global Client

For decorator-based tracing, set the global client:

```typescript
import { BlocklogClient, setGlobalClient } from '@blocklog/sdk';

const client = new BlocklogClient({ apiKey: 'your-api-key' });
setGlobalClient(client);

// Now decorators will use this client
```

## Advanced Usage

### Custom Metadata

```typescript
@traceAgent({
  name: 'trading-agent',
  metadata: {
    strategy: 'momentum',
    risk_level: 'high',
    max_position: 100000
  }
})
async executeTrade(signal: TradeSignal): Promise<Trade> {
  // Agent logic
}
```

### Conditional Tracing

```typescript
class ConditionalAgent {
  @traceAgent('conditional-agent')
  async execute(input: string, trace: boolean = true): Promise<string> {
    if (trace) {
      return await executeAgent('conditional-agent', async () => {
        return this.process(input);
      });
    }
    return this.process(input);
  }

  private async process(input: string): Promise<string> {
    // Processing logic
  }
}
```

### Async Context Preservation

Trace context is preserved across async operations:

```typescript
@traceAgent('async-agent')
async execute(input: string): Promise<string> {
  // Trace context preserved across async operations
  await new Promise(resolve => setTimeout(resolve, 100));
  const result = await this.processAsync(input);
  await new Promise(resolve => setTimeout(resolve, 100));
  return result;
}
```

## Best Practices

### 1. Use Descriptive Agent Names

```typescript
@traceAgent('customer-support-agent')  // Good
async handleCustomerQuery(query: string): Promise<string> {
  // ...
}

@traceAgent('agent')  // Avoid - too generic
async execute(input: string): Promise<string> {
  // ...
}
```

### 2. Include Relevant Metadata

```typescript
@traceAgent({
  name: 'trading-agent',
  metadata: {
    strategy: 'momentum',
    asset_class: 'equities',
    region: 'US'
  }
})
async executeTrade(signal: TradeSignal): Promise<Trade> {
  // ...
}
```

### 3. Handle Errors Gracefully

```typescript
@traceAgent('robust-agent')
async execute(input: string): Promise<string> {
  try {
    return await this.process(input);
  } catch (error) {
    // Error is automatically traced
    throw error; // Re-throw for caller handling
  }
}
```

### 4. Use Versioning

```typescript
@traceAgent({
  name: 'agent-v2',
  version: '2.0.0'
})
async execute(input: string): Promise<string> {
  // Agent logic
}
```

## Troubleshooting

### Events Not Appearing

1. Check that the global client is set for decorators
2. Verify your API key is correct
3. Check network connectivity
4. Enable debug mode: `debug: true`

### Trace Context Lost

1. Ensure async operations use `await` properly
2. Check that you're not breaking the async context chain
3. Verify decorator is applied correctly

### Performance Issues

1. Reduce batch size if events are delayed
2. Consider disabling signing if not needed
3. Check queue depth with `await client.health()`

## Related Guides

- [Tool Tracing](tools.md) - Trace tool/function calls
- [Decision Recording](decisions.md) - Record decision points
- [Tracing Overview](tracing.md) - Understand tracing concepts
