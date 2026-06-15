# Replay Guide

This guide covers how to reconstruct and replay agent executions using the Blocklog TypeScript SDK.

## Overview

Replay features enable debugging and analysis of agent executions, including:
- Trace reconstruction
- Execution replay
- Trace verification
- Comparison of executions
- Debugging support

## Trace Reconstruction

### Reconstructing a Trace

```typescript
import { BlocklogClient } from '@blocklog/sdk';

const client = new BlocklogClient({ apiKey: 'your-api-key' });

await client.replay.reconstruct('trace-123', {
  include_tool_calls: true,
  include_decisions: true
});
```

### Using ReplayClient

The SDK provides a dedicated API client for replay operations:

```typescript
// Reconstruct a trace
const reconstruction = await client.replay.reconstruct('trace-123', {
  include_metadata: true,
  include_context: true
});

// Verify a replay
const verification = await client.replay.verify('replay-456');

// Replay a trace
const result = await client.replay.replay('replay-456', {
  speed: 2,
  stop_on_error: false
});

// Get replay details
const replay = await client.replay.get('replay-456');

// List replays
const replays = await client.replay.list({ trace_id: 'trace-123' });

// Compare executions
const comparison = await client.replay.compare('trace-123', 'trace-456');
```

## Trace Reconstruction Structure

Reconstructed traces include the following structure:

```typescript
{
  replay_id: string;
  trace_id: string;
  events: TraceEvent[];
  timeline: TimelineEvent[];
  metadata: ReplayMetadata;
  reconstructed_at: string;
}
```

## Trace Verification

Verify trace integrity and correctness:

```typescript
const verification = await client.replay.verify('replay-456');

if (verification.valid) {
  console.log('Trace is valid');
  console.log('Verification details:', verification.details);
} else {
  console.log('Trace verification failed:', verification.issues);
}
```

## Trace Replay

Replay a trace for debugging:

```typescript
const result = await client.replay.replay('replay-456', {
  speed: 1,  // Normal speed
  stop_on_error: true,  // Stop on first error
  dry_run: true  // Don't actually execute, just simulate
});

console.log('Replay result:', result);
```

## Execution Comparison

Compare different executions:

```typescript
const comparison = await client.replay.compare('trace-123', 'trace-456');

console.log('Comparison results:', {
  identical: comparison.identical,
  differences: comparison.differences,
  similarity_score: comparison.similarity_score
});
```

## Debugging with Replay

### Debug Failed Executions

```typescript
async function debugFailedExecution(traceId: string) {
  // Reconstruct the failed trace
  const reconstruction = await client.replay.reconstruct(traceId, {
    include_errors: true,
    include_tool_calls: true
  });

  // Analyze the failure
  const errors = reconstruction.events.filter(e => e.status === 'error');
  
  console.log('Errors found:', errors);
  
  // Replay to understand the failure
  const replay = await client.replay.replay(reconstruction.replay_id, {
    stop_on_error: true,
    debug: true
  });

  return replay;
}
```

### Compare Before and After

```typescript
async function compareFix(beforeTraceId: string, afterTraceId: string) {
  const comparison = await client.replay.compare(beforeTraceId, afterTraceId);
  
  console.log('Fix comparison:', {
    differences: comparison.differences,
    improvements: comparison.improvements,
    regressions: comparison.regressions
  });
}
```

## Replay Options

Configure replay behavior:

```typescript
await client.replay.replay('replay-456', {
  speed: 2,  // 2x speed
  stop_on_error: false,  // Continue on errors
  dry_run: true,  // Simulation only
  debug: true,  // Debug mode
  max_steps: 100,  // Limit steps
  timeout: 60000  // Timeout in ms
});
```

## Timeline Analysis

Analyze execution timeline:

```typescript
const reconstruction = await client.replay.reconstruct('trace-123', {
  include_timeline: true
});

console.log('Timeline:', reconstruction.timeline);

// Analyze timing
const timingAnalysis = reconstruction.timeline.reduce((acc, event) => {
  acc.total_duration += event.duration_ms;
  acc.step_count += 1;
  return acc;
}, { total_duration: 0, step_count: 0 });

console.log('Average step duration:', timingAnalysis.total_duration / timingAnalysis.step_count);
```

## Tool Call Replay

Replay tool calls with original parameters:

```typescript
await client.replay.replay('replay-456', {
  replay_tool_calls: true,
  tool_call_timeout: 30000,
  tool_call_retry: 3
});
```

## Decision Replay

Replay decision points:

```typescript
await client.replay.replay('replay-456', {
  replay_decisions: true,
  decision_override: {
    'decision-123': { output: { approved: true } }  // Override specific decision
  }
});
```

## Best Practices

### 1. Use Descriptive Replay Names

```typescript
await client.replay.reconstruct('trace-123', {
  metadata: {
    replay_name: 'debug-trading-agent-failure',
    purpose: 'debugging',
    requested_by: 'developer@company.com'
  }
});
```

### 2. Include Relevant Context

```typescript
await client.replay.reconstruct('trace-123', {
  include_metadata: true,
  include_context: true,
  include_tool_calls: true,
  include_decisions: true
});
```

### 3. Use Dry Run for Testing

```typescript
await client.replay.replay('replay-456', {
  dry_run: true,  // Test without actual execution
  debug: true
});
```

### 4. Analyze Replay Results

```typescript
const result = await client.replay.replay('replay-456', {
  debug: true
});

console.log('Replay analysis:', {
  steps_executed: result.steps_executed,
  steps_failed: result.steps_failed,
  total_duration: result.total_duration,
  memory_usage: result.memory_usage
});
```

## Integration with Tracing

Replay integrates with trace data:

```typescript
async function debugWithReplay(traceId: string) {
  // Get original trace
  const trace = await client.traces.get(traceId);
  
  // Reconstruct for analysis
  const reconstruction = await client.replay.reconstruct(traceId);
  
  // Compare with current behavior
  const currentTrace = await getCurrentTrace();
  const comparison = await client.replay.compare(traceId, currentTrace.id);
  
  return {
    original: trace,
    reconstruction: reconstruction,
    comparison: comparison
  };
}
```

## Troubleshooting

### Reconstruction Failing

1. Verify trace ID exists
2. Check that trace has completed
3. Ensure trace data is available
4. Check API permissions

### Replay Not Working

1. Verify replay ID is correct
2. Check that reconstruction succeeded
3. Ensure replay options are valid
4. Check for missing dependencies

### Comparison Not Showing Differences

1. Verify both trace IDs exist
2. Check that traces have similar structure
3. Ensure comparison parameters are correct
4. Check for data availability

## Related Guides

- [Agent Tracing](agents.md) - Trace agent executions
- [Tool Tracing](tools.md) - Trace tool calls
- [Tracing Overview](tracing.md) - Understand tracing concepts
