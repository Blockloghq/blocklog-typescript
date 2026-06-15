# Tool Tracing Guide

This guide covers how to trace tool and function calls within AI agents using the Blocklog TypeScript SDK.

## Overview

Tool tracing provides visibility into function and tool invocations, including:
- Tool name and parameters
- Execution time
- Return values
- Error handling
- Trace context propagation

## Using @tool Decorator

The simplest way to trace tools is using the `@tool` decorator:

```typescript
import { traceTool } from '@blocklog/sdk';

class Calculator {
  @traceTool('calculator')
  async add(a: number, b: number): Promise<number> {
    return a + b;
  }

  @traceTool('calculator')
  async multiply(a: number, b: number): Promise<number> {
    return a * b;
  }
}
```

## Manual Tool Tracing

For more control, use the `TOOL_CALL` event type:

```typescript
import { BlocklogClient } from '@blocklog/sdk';

const client = new BlocklogClient({ apiKey: 'your-api-key' });

async function executeTool(toolName: string, params: any) {
  const startTime = Date.now();
  
  try {
    const result = await yourToolImplementation(params);
    
    await client.event('TOOL_CALL', {
      tool_name: toolName,
      parameters: params,
      result: result,
      duration_ms: Date.now() - startTime,
      status: 'success'
    });
    
    return result;
  } catch (error) {
    await client.event('TOOL_CALL', {
      tool_name: toolName,
      parameters: params,
      error: error.message,
      duration_ms: Date.now() - startTime,
      status: 'error'
    });
    
    throw error;
  }
}
```

## Tool Event Structure

Tool events include the following structure:

```typescript
{
  tool_name: string;
  parameters: Record<string, any>;
  result?: any;
  error?: string;
  duration_ms: number;
  status: 'success' | 'error';
  timestamp: string;
}
```

## Tool Categories

Organize tools by category for better filtering:

```typescript
class DataTools {
  @traceTool('database-query')
  async query(sql: string): Promise<any> {
    // Database query logic
  }

  @traceTool('cache-get')
  async get(key: string): Promise<any> {
    // Cache get logic
  }
}

class APITools {
  @traceTool('api-call')
  async callAPI(endpoint: string, params: any): Promise<any> {
    // API call logic
  }
}
```

## Tool Metadata

Add metadata to tool calls for better organization:

```typescript
@traceTool({
  name: 'weather-api',
  category: 'external-api',
  metadata: {
    provider: 'openweathermap',
    rate_limit: 1000,
    timeout: 5000
  }
})
async getWeather(location: string): Promise<string> {
  // Tool implementation
}
```

## Error Handling

Tool errors are automatically captured:

```typescript
@traceTool('risky-tool')
async riskyOperation(input: string): Promise<string> {
  if (input === 'invalid') {
    throw new Error('Invalid input');
  }
  return 'success';
}

// This will emit TOOL_CALL event with error details
```

## Tool Performance

Track tool performance metrics:

```typescript
@traceTool('expensive-tool')
async expensiveOperation(data: any): Promise<any> {
  const start = performance.now();
  
  const result = await this.processLargeData(data);
  
  const duration = performance.now() - start;
  
  // Duration is automatically tracked in the event
  return result;
}
```

## Tool Chains

Trace sequences of tool calls:

```typescript
class Workflow {
  @traceTool('tool-a')
  async stepA(input: string): Promise<string> {
    return `A: ${input}`;
  }

  @traceTool('tool-b')
  async stepB(input: string): Promise<string> {
    return `B: ${input}`;
  }

  @traceTool('tool-c')
  async stepC(input: string): Promise<string> {
    return `C: ${input}`;
  }

  async executeWorkflow(input: string): Promise<string> {
    const resultA = await this.stepA(input);
    const resultB = await this.stepB(resultA);
    const resultC = await this.stepC(resultB);
    return resultC;
  }
}
```

## Parallel Tool Execution

Trace parallel tool executions:

```typescript
async function parallelTools() {
  const results = await Promise.all([
    toolA.execute('input1'),
    toolB.execute('input2'),
    toolC.execute('input3')
  ]);
  
  return results;
}
```

## Tool Versioning

Track tool versions for compatibility:

```typescript
@traceTool({
  name: 'data-processor',
  version: '2.1.0',
  metadata: {
    breaking_changes: false,
    deprecated: false
  }
})
async processData(data: any): Promise<any> {
  // Processing logic
}
```

## Tool Permissions

Track tool access and permissions:

```typescript
@traceTool({
  name: 'admin-tool',
  metadata: {
    required_permission: 'admin',
    audit_log: true
  }
})
async adminOperation(params: any): Promise<any> {
  // Admin-only logic
}
```

## Best Practices

### 1. Use Descriptive Tool Names

```typescript
@traceTool('user-profile-fetch')  // Good
async getUserProfile(userId: string): Promise<User> {
  // ...
}

@traceTool('tool1')  // Avoid - not descriptive
async doSomething(input: string): Promise<string> {
  // ...
}
```

### 2. Include Relevant Parameters

```typescript
@traceTool('database-query')
async query(sql: string, params: any): Promise<any> {
  // Parameters are automatically captured
}
```

### 3. Handle Errors Gracefully

```typescript
@traceTool('robust-tool')
async execute(input: string): Promise<string> {
  try {
    return await this.process(input);
  } catch (error) {
    // Error is automatically traced
    throw error;
  }
}
```

### 4. Track Tool Categories

```typescript
@traceTool({
  name: 'user-api',
  category: 'external-api',
  metadata: {
    endpoint: '/api/users',
    method: 'GET'
  }
})
async fetchUser(userId: string): Promise<User> {
  // API call logic
}
```

## Integration with Agent Tracing

Tools are automatically traced within agent executions:

```typescript
class MyAgent {
  @traceAgent('my-agent')
  async execute(input: string): Promise<string> {
    // Tool calls within agent are automatically traced
    const result1 = await this.toolA(input);
    const result2 = await this.toolB(result1);
    return result2;
  }

  @traceTool('tool-a')
  async toolA(input: string): Promise<string> {
    return `A: ${input}`;
  }

  @traceTool('tool-b')
  async toolB(input: string): Promise<string> {
    return `B: ${input}`;
  }
}
```

## Troubleshooting

### Tool Events Not Appearing

1. Verify decorator is applied correctly
2. Check that global client is set
3. Ensure tool is actually being called
4. Enable debug mode for detailed logging

### Missing Tool Parameters

1. Ensure parameters are serializable
2. Check for circular references
3. Verify parameter types are supported

### Performance Issues

1. Reduce tool call frequency if possible
2. Consider batching related operations
3. Check tool execution time with duration_ms

## Related Guides

- [Agent Tracing](agents.md) - Trace agent executions
- [Decision Recording](decisions.md) - Record decision points
- [Tracing Overview](tracing.md) - Understand tracing concepts
