# Tracing Overview Guide

This guide provides an overview of the tracing infrastructure in the Blocklog TypeScript SDK.

## Overview

The tracing infrastructure provides distributed tracing capabilities for AI agent executions, including:
- Span lifecycle management
- Trace context propagation
- Async context preservation
- Parent-child relationships
- Error span tracking

## TraceManager

The `TraceManager` is a static class that manages span lifecycle and context propagation.

### Starting a Span

```typescript
import { TraceManager } from '@blocklog/sdk';

const span = TraceManager.startSpan('my-operation', {
  metadata: { key: 'value' }
});
```

### Ending a Span

```typescript
TraceManager.endSpan(span, 'success');
```

### Current Span

Get the current active span:

```typescript
const currentSpan = TraceManager.currentSpan();
```

### Parent Span

Get the parent span:

```typescript
const parentSpan = TraceManager.parentSpan();
```

### Running with Span

Execute a function within a span context:

```typescript
const result = await TraceManager.runWithSpan(span, async () => {
  // This code runs within the span context
  return 'result';
});
```

## Span Structure

Spans include the following structure:

```typescript
{
  span_id: string;
  trace_id: string;
  parent_span_id?: string;
  name: string;
  status?: string;
  start_time: number;
  end_time?: number;
  duration_ms?: number;
  metadata?: Record<string, any>;
}
```

## Trace Context Propagation

Trace context automatically propagates across async operations:

```typescript
async function parentOperation() {
  const parentSpan = TraceManager.startSpan('parent');
  
  await childOperation(); // Automatically inherits parent context
  
  TraceManager.endSpan(parentSpan);
}

async function childOperation() {
  const currentSpan = TraceManager.currentSpan(); // Has parent context
  console.log('Parent span ID:', currentSpan.parent_span_id);
}
```

## Parent-Child Relationships

Create nested spans for hierarchical tracing:

```typescript
async function complexOperation() {
  const parentSpan = TraceManager.startSpan('complex-operation');
  
  // Child span 1
  const child1 = TraceManager.startSpan('step-1');
  await step1();
  TraceManager.endSpan(child1);
  
  // Child span 2
  const child2 = TraceManager.startSpan('step-2');
  await step2();
  TraceManager.endSpan(child2);
  
  TraceManager.endSpan(parentSpan);
}
```

## Error Spans

Track errors in spans:

```typescript
async function errorOperation() {
  const span = TraceManager.startSpan('error-operation');
  
  try {
    await riskyOperation();
    TraceManager.endSpan(span, 'success');
  } catch (error) {
    TraceManager.endSpan(span, 'error');
  }
}
```

## Async Context Preservation

Trace context is preserved across async boundaries:

```typescript
async function asyncOperation() {
  const span = TraceManager.startSpan('async-operation');
  
  await new Promise(resolve => setTimeout(resolve, 100));
  const result = await fetchData();
  await processData(result);
  
  TraceManager.endSpan(span);
}
```

## Span Metadata

Add metadata to spans for additional context:

```typescript
const span = TraceManager.startSpan('operation', {
  metadata: {
    user_id: 'user-123',
    session_id: 'session-456',
    custom_field: 'value'
  }
});
```

## Span Options

Configure span behavior:

```typescript
const span = TraceManager.startSpan('operation', {
  metadata: { key: 'value' },
  tags: ['important', 'critical'],
  attributes: {
    service: 'my-service',
    version: '1.0.0'
  }
});
```

## Integration with Events

Spans automatically include trace context in events:

```typescript
async function tracedEvent() {
  const span = TraceManager.startSpan('traced-event');
  
  await client.event('MY_EVENT', {
    data: 'value',
    trace_id: span.trace_id,
    span_id: span.span_id
  });
  
  TraceManager.endSpan(span);
}
```

## Best Practices

### 1. Use Descriptive Span Names

```typescript
TraceManager.startSpan('user-authentication-flow')  // Good
TraceManager.startSpan('operation')  // Avoid - too generic
```

### 2. Always End Spans

```typescript
async function operation() {
  const span = TraceManager.startSpan('operation');
  
  try {
    await doWork();
  } finally {
    TraceManager.endSpan(span); // Always end span
  }
}
```

### 3. Use Appropriate Span Granularity

```typescript
// Good - appropriate granularity
const parentSpan = TraceManager.startSpan('user-registration');
const childSpan = TraceManager.startSpan('validate-input');
TraceManager.endSpan(childSpan);
TraceManager.endSpan(parentSpan);

// Avoid - too fine-grained
const span1 = TraceManager.startSpan('check-1');
const span2 = TraceManager.startSpan('check-2');
const span3 = TraceManager.startSpan('check-3');
```

### 4. Include Relevant Metadata

```typescript
const span = TraceManager.startSpan('operation', {
  metadata: {
    user_id: getCurrentUserId(),
    operation_type: 'write',
    resource: 'database'
  }
});
```

## Troubleshooting

### Trace Context Lost

1. Ensure async operations use `await` properly
2. Check that you're not breaking the async context chain
3. Verify spans are properly nested
4. Check for context-breaking operations

### Spans Not Appearing

1. Verify span is started before operations
2. Ensure span is ended after operations
3. Check that events include trace context
4. Verify client configuration

### Parent-Child Relationships Broken

1. Ensure child spans are created within parent context
2. Check that parent span is still active
3. Verify async context preservation
4. Check for context loss scenarios

## Related Guides

- [Agent Tracing](agents.md) - Trace agent executions
- [Tool Tracing](tools.md) - Trace tool calls
- [Middleware Guide](middleware.md) - Transform events with middleware
