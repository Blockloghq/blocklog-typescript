# OpenAI Agents Integration Guide

This guide covers how to integrate the Blocklog SDK with OpenAI Agents for automatic instrumentation.

## Overview

The Blocklog SDK provides native integration with OpenAI Agents, automatically tracing:
- Agent runs
- Tool calls
- Function calls
- Messages

## Installation

Install the required packages:

```bash
npm install @blocklog/sdk openai
```

## Basic Setup

Initialize the Blocklog client and instrument OpenAI Agents:

```typescript
import { BlocklogClient, setGlobalClient } from '@blocklog/sdk';
import { instrumentOpenAIAgents } from '@blocklog/sdk';

const client = new BlocklogClient({ apiKey: 'your-api-key' });
setGlobalClient(client);

const hooks = instrumentOpenAIAgents();
```

## Agent Run Tracing

### Automatic Agent Run Tracing

```typescript
import { OpenAI } from 'openai';
import { instrumentOpenAIAgents } from '@blocklog/sdk';

const openai = new OpenAI({ apiKey: 'your-openai-key' });
const hooks = instrumentOpenAIAgents();

// Agent run is automatically traced
const response = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: 'Hello' }]
});
```

### Manual Agent Run Tracing

```typescript
const hooks = instrumentOpenAIAgents();

// Trace agent run start
hooks.onAgentRunStart('my-agent', { input: 'test input' });

// Execute agent
const result = await agent.execute('test input');

// Trace agent run end
hooks.onAgentRunEnd('my-agent', { output: result });
```

## Tool Call Tracing

### Automatic Tool Call Tracing

```typescript
const tools = [
  {
    type: 'function',
    function: {
      name: 'calculator',
      description: 'Performs calculations',
      parameters: {
        type: 'object',
        properties: {
          expression: { type: 'string' }
        }
      }
    }
  }
];

// Tool calls are automatically traced
const response = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: 'What is 2 + 2?' }],
  tools: tools,
  tool_choice: 'auto'
});
```

### Manual Tool Call Tracing

```typescript
const hooks = instrumentOpenAIAgents();

// Trace tool call
hooks.onToolCall('calculator', { expression: '2 + 2' });

// Execute tool
const result = await calculate('2 + 2');

// Trace tool result
hooks.onMessage('assistant', `The result is ${result}`);
```

## Message Tracing

### Automatic Message Tracing

```typescript
// Messages are automatically traced
const response = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Hello' }
  ]
});
```

### Manual Message Tracing

```typescript
const hooks = instrumentOpenAIAgents();

// Trace user message
hooks.onMessage('user', 'Hello, how are you?');

// Trace assistant message
hooks.onMessage('assistant', 'I am doing well, thank you!');
```

## Function Call Tracing

### Automatic Function Call Tracing

```typescript
const functions = [
  {
    name: 'get_weather',
    description: 'Get the current weather',
    parameters: {
      type: 'object',
      properties: {
        location: { type: 'string' }
      }
    }
  }
];

// Function calls are automatically traced
const response = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: 'What is the weather in San Francisco?' }],
  functions: functions,
  function_call: 'auto'
});
```

### Manual Function Call Tracing

```typescript
const hooks = instrumentOpenAIAgents();

// Trace function call
hooks.onFunctionCall('get_weather', { location: 'San Francisco' });

// Execute function
const weather = await getWeather('San Francisco');

// Trace function result
hooks.onMessage('assistant', `The weather in San Francisco is ${weather}`);
```

## Custom Callback Handler

Create a custom callback handler for advanced integration:

```typescript
class BlocklogOpenAIHandler {
  hooks = instrumentOpenAIAgents();

  onAgentRunStart(agentId: string, input: any) {
    this.hooks.onAgentRunStart(agentId, input);
  }

  onAgentRunEnd(agentId: string, output: any) {
    this.hooks.onAgentRunEnd(agentId, output);
  }

  onToolCall(toolName: string, args: any) {
    this.hooks.onToolCall(toolName, args);
  }

  onMessage(role: string, content: string) {
    this.hooks.onMessage(role, content);
  }
}

// Use the callback handler
const handler = new BlocklogOpenAIHandler();
```

## Complete Example

```typescript
import { BlocklogClient, setGlobalClient } from '@blocklog/sdk';
import { instrumentOpenAIAgents } from '@blocklog/sdk';
import { OpenAI } from 'openai';

// Initialize Blocklog
const client = new BlocklogClient({ apiKey: 'your-api-key' });
setGlobalClient(client);

// Instrument OpenAI Agents
const hooks = instrumentOpenAIAgents();

// Initialize OpenAI
const openai = new OpenAI({ apiKey: 'your-openai-key' });

// Define tools
const tools = [
  {
    type: 'function',
    function: {
      name: 'calculator',
      description: 'Performs calculations',
      parameters: {
        type: 'object',
        properties: {
          expression: { type: 'string' }
        },
        required: ['expression']
      }
    }
  }
];

// Execute agent with tools (automatically traced)
const response = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [
    { role: 'system', content: 'You are a helpful assistant with a calculator.' },
    { role: 'user', content: 'What is 2 + 2?' }
  ],
  tools: tools,
  tool_choice: 'auto'
});

console.log('Response:', response.choices[0].message);

// Clean up
await client.shutdown();
```

## Agent Error Handling

Handle agent errors with tracing:

```typescript
const hooks = instrumentOpenAIAgents();

hooks.onAgentRunStart('my-agent', { input: 'test' });

try {
  const result = await agent.execute('test');
  hooks.onAgentRunEnd('my-agent', { output: result });
} catch (error) {
  hooks.onAgentRunError('my-agent', error);
  throw error;
}
```

## Agent Metadata

Add metadata to agent runs:

```typescript
const hooks = instrumentOpenAIAgents();

hooks.onAgentRunStart('my-agent', {
  input: 'test',
  metadata: {
    user_id: 'user-123',
    session_id: 'session-456',
    environment: 'production'
  }
});
```

## Best Practices

### 1. Set Global Client

Always set the global client before instrumenting:

```typescript
const client = new BlocklogClient({ apiKey: 'your-api-key' });
setGlobalClient(client);
const hooks = instrumentOpenAIAgents();
```

### 2. Use Descriptive Agent IDs

```typescript
hooks.onAgentRunStart('customer-support-agent', { input: 'test' });
```

### 3. Include Relevant Context

```typescript
hooks.onAgentRunStart('my-agent', {
  input: 'test',
  metadata: { user_id: '123', session_id: '456' }
});
```

### 4. Handle Errors

```typescript
try {
  await agent.execute(input);
} catch (error) {
  hooks.onAgentRunError('my-agent', error);
  throw error;
}
```

## Troubleshooting

### Events Not Appearing

1. Verify global client is set
2. Check that hooks are initialized
3. Ensure OpenAI API calls are configured
4. Check network connectivity

### Trace Context Lost

1. Ensure agent ID is consistent
2. Check that messages are properly traced
3. Verify async context preservation
4. Check for callback conflicts

### Performance Issues

1. Reduce callback frequency if needed
2. Consider selective instrumentation
3. Check queue depth with `await client.health()`
4. Adjust batch size configuration

## Related Guides

- [LangChain Integration](langchain.md) - LangChain integration
- [LangGraph Integration](langgraph.md) - LangGraph integration
- [Agent Tracing](../guides/agents.md) - Agent tracing concepts
