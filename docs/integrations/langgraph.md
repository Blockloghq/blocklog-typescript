# LangGraph Integration Guide

This guide covers how to integrate the Blocklog SDK with LangGraph for automatic instrumentation.

## Overview

The Blocklog SDK provides native integration with LangGraph, automatically tracing:
- Node executions
- Edge transitions
- Graph lifecycle
- State changes

## Installation

Install the required packages:

```bash
npm install @blocklog/sdk langgraph
```

## Basic Setup

Initialize the Blocklog client and instrument LangGraph:

```typescript
import { BlocklogClient, setGlobalClient } from '@blocklog/sdk';
import { instrumentLangGraph } from '@blocklog/sdk';

const client = new BlocklogClient({ apiKey: 'your-api-key' });
setGlobalClient(client);

const hooks = instrumentLangGraph();
```

## Node Tracing

### Automatic Node Tracing

```typescript
import { StateGraph } from 'langgraph';

const graph = new StateGraph({
  // Graph configuration
});

// Add nodes
graph.addNode('process', async (state) => {
  // Node execution is automatically traced
  return { result: 'processed' };
});

// Node execution is automatically traced when graph runs
const result = await graph.invoke({ input: 'test' });
```

### Manual Node Tracing

```typescript
const hooks = instrumentLangGraph();

// Trace node start
hooks.onNodeStart('process-node', { input: 'test' }, 'graph-run-id-123');

// Execute node
const result = await processNode({ input: 'test' });

// Trace node end
hooks.onNodeEnd('process-node', { output: result }, 'graph-run-id-123');
```

## Edge Tracing

### Automatic Edge Tracing

```typescript
// Define edges
graph.addEdge('node-a', 'node-b');
graph.addConditionalEdges('node-a', {
  condition1: 'node-b',
  condition2: 'node-c'
});

// Edge transitions are automatically traced
const result = await graph.invoke({ input: 'test' });
```

### Manual Edge Tracing

```typescript
const hooks = instrumentLangGraph();

// Trace edge transition
hooks.onEdge('node-a', 'node-b', true, 'graph-run-id-123');
```

## Graph Lifecycle

### Automatic Graph Tracing

```typescript
const graph = new StateGraph({
  // Graph configuration
});

// Graph execution is automatically traced
const result = await graph.invoke({ input: 'test' });
```

### Manual Graph Tracing

```typescript
const hooks = instrumentLangGraph();

// Trace graph start
hooks.onGraphStart({ graph_id: 'my-graph' });

// Execute graph
const result = await graph.invoke({ input: 'test' });

// Trace graph end
hooks.onGraphEnd({ graph_id: 'my-graph' });
```

## Custom Callback Handler

Create a custom callback handler for advanced integration:

```typescript
import { BaseCallbackHandler } from 'langchain/callbacks';

class BlocklogLangGraphHandler extends BaseCallbackHandler {
  name = 'blocklog_langgraph_handler';

  async onNodeStart(nodeName, state, runId) {
    const hooks = instrumentLangGraph();
    hooks.onNodeStart(nodeName, state, runId);
  }

  async onNodeEnd(nodeName, state, runId) {
    const hooks = instrumentLangGraph();
    hooks.onNodeEnd(nodeName, state, runId);
  }

  async onEdge(from, to, condition, runId) {
    const hooks = instrumentLangGraph();
    hooks.onEdge(from, to, condition, runId);
  }
}

// Use the callback handler
const graph = new StateGraph({
  callbacks: [new BlocklogLangGraphHandler()]
});
```

## Complete Example

```typescript
import { BlocklogClient, setGlobalClient } from '@blocklog/sdk';
import { instrumentLangGraph } from '@blocklog/sdk';
import { StateGraph } from 'langgraph';

// Initialize Blocklog
const client = new BlocklogClient({ apiKey: 'your-api-key' });
setGlobalClient(client);

// Instrument LangGraph
const hooks = instrumentLangGraph();

// Define graph
const graph = new StateGraph({
  channels: {
    input: { value: null },
    output: { value: null }
  }
});

// Add nodes
graph.addNode('process', async (state) => {
  console.log('Processing:', state.input);
  return { output: `processed: ${state.input}` };
});

graph.addNode('validate', async (state) => {
  console.log('Validating:', state.output);
  return { output: `validated: ${state.output}` };
});

// Add edges
graph.addEdge('process', 'validate');
graph.setEntryPoint('process');
graph.setFinishPoint('validate');

// Compile graph
const compiledGraph = graph.compile();

// Execute graph (automatically traced)
const result = await compiledGraph.invoke({ input: 'test input' });

console.log('Result:', result);

// Clean up
await client.shutdown();
```

## Conditional Edges

Trace conditional edge transitions:

```typescript
graph.addConditionalEdges('decision-node', {
  high_priority: 'process-node',
  low_priority: 'queue-node',
  default: 'reject-node'
});

// Conditional edges are automatically traced
const result = await graph.invoke({ input: 'test' });
```

## State Tracking

Track state changes across nodes:

```typescript
const hooks = instrumentLangGraph();

hooks.onNodeStart('node-a', { state: { value: 1 } }, 'run-id');
hooks.onNodeEnd('node-a', { state: { value: 2 } }, 'run-id');
hooks.onNodeStart('node-b', { state: { value: 2 } }, 'run-id');
hooks.onNodeEnd('node-b', { state: { value: 3 } }, 'run-id');
```

## Graph Metadata

Add metadata to graph executions:

```typescript
const hooks = instrumentLangGraph();

hooks.onGraphStart({
  graph_id: 'my-graph',
  metadata: {
    version: '1.0',
    environment: 'production',
    user_id: 'user-123'
  }
});
```

## Best Practices

### 1. Set Global Client

Always set the global client before instrumenting:

```typescript
const client = new BlocklogClient({ apiKey: 'your-api-key' });
setGlobalClient(client);
const hooks = instrumentLangGraph();
```

### 2. Use Descriptive Node Names

```typescript
graph.addNode('customer-data-processor', async (state) => {
  // Processing logic
});
```

### 3. Include Relevant State

```typescript
hooks.onNodeStart('node-a', {
  state: { input: 'test', metadata: { user_id: '123' } }
}, 'run-id');
```

### 4. Handle Errors

```typescript
try {
  await graph.invoke({ input: 'test' });
} catch (error) {
  // Error is automatically traced
  console.error('Graph execution failed:', error);
}
```

## Troubleshooting

### Events Not Appearing

1. Verify global client is set
2. Check that hooks are initialized
3. Ensure graph callbacks are configured
4. Check network connectivity

### Trace Context Lost

1. Ensure runId is consistent across nodes
2. Check that state is properly propagated
3. Verify async context preservation
4. Check for callback conflicts

### Performance Issues

1. Reduce callback frequency if needed
2. Consider selective instrumentation
3. Check queue depth with `await client.health()`
4. Adjust batch size configuration

## Related Guides

- [LangChain Integration](langchain.md) - LangChain integration
- [OpenAI Agents Integration](openai-agents.md) - OpenAI Agents integration
- [Agent Tracing](../guides/agents.md) - Agent tracing concepts
