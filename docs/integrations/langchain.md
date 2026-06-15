# LangChain Integration Guide

This guide covers how to integrate the Blocklog SDK with LangChain for automatic instrumentation.

## Overview

The Blocklog SDK provides native integration with LangChain, automatically tracing:
- Chain executions
- Tool calls
- LLM invocations
- Agent runs

## Installation

Install the required packages:

```bash
npm install @blocklog/sdk langchain
```

## Basic Setup

Initialize the Blocklog client and instrument LangChain:

```typescript
import { BlocklogClient, setGlobalClient } from '@blocklog/sdk';
import { instrumentLangChain } from '@blocklog/sdk';

const client = new BlocklogClient({ apiKey: 'your-api-key' });
setGlobalClient(client);

const tracer = instrumentLangChain();
```

## Chain Tracing

### Automatic Chain Tracing

```typescript
import { Chain } from 'langchain/chains';
import { tracer } from '@blocklog/sdk';

const chain = new Chain({
  // Chain configuration
});

// Chain execution is automatically traced
const result = await chain.call({ input: 'test input' });
```

### Manual Chain Tracing

```typescript
import { instrumentLangChain } from '@blocklog/sdk';

const tracer = instrumentLangChain();

// Manually trace chain start
tracer.handleChainStart(
  { name: 'my-chain' },
  { input: 'test input' },
  'run-id-123'
);

// Execute chain
const result = await chain.execute();

// Manually trace chain end
tracer.handleChainEnd(
  { output: result },
  'run-id-123'
);
```

## Tool Tracing

### Automatic Tool Tracing

```typescript
import { Tool } from 'langchain/tools';

const myTool = new Tool({
  name: 'calculator',
  description: 'Performs calculations',
  func: async (input) => {
    // Tool execution is automatically traced
    return calculate(input);
  }
});
```

### Manual Tool Tracing

```typescript
const tracer = instrumentLangChain();

// Trace tool start
tracer.handleToolStart(
  { name: 'calculator' },
  '2 + 2',
  'tool-run-id-456'
);

// Execute tool
const result = await calculate('2 + 2');

// Trace tool end
tracer.handleToolEnd(
  result,
  'tool-run-id-456'
);
```

## LLM Tracing

### Automatic LLM Tracing

```typescript
import { ChatOpenAI } from 'langchain/chat_models/openai';

const llm = new ChatOpenAI({
  modelName: 'gpt-4',
  temperature: 0
});

// LLM calls are automatically traced
const response = await llm.call('Hello, how are you?');
```

### Manual LLM Tracing

```typescript
const tracer = instrumentLangChain();

// Trace LLM start
tracer.handleLLMStart(
  { model: 'gpt-4', temperature: 0 },
  ['Hello, how are you?'],
  'llm-run-id-789'
);

// Execute LLM call
const response = await llm.call('Hello, how are you?');

// Trace LLM end
tracer.handleLLMEnd(
  { output: response },
  'llm-run-id-789'
);
```

## Agent Tracing

### Automatic Agent Tracing

```typescript
import { AgentExecutor, createOpenAIFunctionsAgent } from 'langchain/agents';

const agent = await createOpenAIFunctionsAgent(llm, tools, prompt);
const agentExecutor = new AgentExecutor({
  agent,
  tools,
  verbose: true
});

// Agent execution is automatically traced
const result = await agentExecutor.invoke({ input: 'What is the weather?' });
```

## Custom Callback Handler

Create a custom callback handler for advanced integration:

```typescript
import { BaseCallbackHandler } from 'langchain/callbacks';

class BlocklogCallbackHandler extends BaseCallbackHandler {
  name = 'blocklog_handler';

  async handleChainStart(chain, inputs, runId) {
    const tracer = instrumentLangChain();
    tracer.handleChainStart(chain, inputs, runId);
  }

  async handleChainEnd(outputs, runId) {
    const tracer = instrumentLangChain();
    tracer.handleChainEnd(outputs, runId);
  }

  async handleToolStart(tool, input, runId) {
    const tracer = instrumentLangChain();
    tracer.handleToolStart(tool, input, runId);
  }

  async handleToolEnd(output, runId) {
    const tracer = instrumentLangChain();
    tracer.handleToolEnd(output, runId);
  }

  async handleLLMStart(llm, prompts, runId) {
    const tracer = instrumentLangChain();
    tracer.handleLLMStart(llm, prompts, runId);
  }

  async handleLLMEnd(output, runId) {
    const tracer = instrumentLangChain();
    tracer.handleLLMEnd(output, runId);
  }
}

// Use the callback handler
const executor = new AgentExecutor({
  agent,
  tools,
  callbacks: [new BlocklogCallbackHandler()]
});
```

## Complete Example

```typescript
import { BlocklogClient, setGlobalClient } from '@blocklog/sdk';
import { instrumentLangChain } from '@blocklog/sdk';
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { Tool } from 'langchain/tools';
import { AgentExecutor, createOpenAIFunctionsAgent } from 'langchain/agents';

// Initialize Blocklog
const client = new BlocklogClient({ apiKey: 'your-api-key' });
setGlobalClient(client);

// Instrument LangChain
const tracer = instrumentLangChain();

// Create LLM
const llm = new ChatOpenAI({
  modelName: 'gpt-4',
  temperature: 0
});

// Create tool
const calculatorTool = new Tool({
  name: 'calculator',
  description: 'Performs calculations',
  func: async (input) => {
    const result = eval(input);
    return String(result);
  }
});

// Create agent
const agent = await createOpenAIFunctionsAgent(llm, [calculatorTool], prompt);
const executor = new AgentExecutor({
  agent,
  tools: [calculatorTool]
});

// Execute agent (automatically traced)
const result = await executor.invoke({ input: 'What is 2 + 2?' });

// Clean up
await client.shutdown();
```

## Best Practices

### 1. Set Global Client

Always set the global client before instrumenting:

```typescript
const client = new BlocklogClient({ apiKey: 'your-api-key' });
setGlobalClient(client);
const tracer = instrumentLangChain();
```

### 2. Use Descriptive Names

```typescript
tracer.handleChainStart(
  { name: 'customer-support-chain' },  // Good
  input,
  runId
);
```

### 3. Include Relevant Context

```typescript
tracer.handleChainStart(
  { name: 'chain', metadata: { user_id: '123' } },
  input,
  runId
);
```

### 4. Handle Errors

```typescript
try {
  await chain.execute();
} catch (error) {
  // Error is automatically traced
  console.error('Chain execution failed:', error);
}
```

## Troubleshooting

### Events Not Appearing

1. Verify global client is set
2. Check that tracer is initialized
3. Ensure LangChain callbacks are configured
4. Check network connectivity

### Trace Context Lost

1. Ensure callbacks are properly chained
2. Check that runId is consistent
3. Verify async context preservation
4. Check for callback conflicts

### Performance Issues

1. Reduce callback frequency if needed
2. Consider selective instrumentation
3. Check queue depth with `await client.health()`
4. Adjust batch size configuration

## Related Guides

- [LangGraph Integration](langgraph.md) - LangGraph integration
- [OpenAI Agents Integration](openai-agents.md) - OpenAI Agents integration
- [Agent Tracing](../guides/agents.md) - Agent tracing concepts
