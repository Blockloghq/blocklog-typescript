# Middleware Guide

This guide covers how to use middleware hooks to transform and enrich events in the Blocklog TypeScript SDK.

## Overview

Middleware hooks allow you to intercept and modify events before they are sent to the Blocklog API, enabling:
- Event transformation
- Data enrichment
- Validation
- Filtering
- Custom logging

## Adding Middleware

### Basic Middleware Hook

```typescript
import { BlocklogClient } from '@blocklog/sdk';

const client = new BlocklogClient({ apiKey: 'your-api-key' });

client.addHook((event) => {
  // Transform event
  event.metadata = {
    ...event.metadata,
    enriched_at: new Date().toISOString(),
    environment: process.env.NODE_ENV
  };
  
  return event;
});
```

### Middleware Hook Structure

Middleware hooks receive and return event objects:

```typescript
type MiddlewareHook = (event: EventEnvelope) => EventEnvelope | Promise<EventEnvelope>;

interface EventEnvelope {
  event_type: string;
  payload: any;
  metadata?: Record<string, any>;
  timestamp?: string;
  trace_id?: string;
  span_id?: string;
}
```

## Middleware Use Cases

### Event Enrichment

Add additional context to events:

```typescript
client.addHook((event) => {
  return {
    ...event,
    metadata: {
      ...event.metadata,
      user_id: getCurrentUserId(),
      session_id: getSessionId(),
      request_id: generateRequestId()
    }
  };
});
```

### Data Masking

Mask sensitive data:

```typescript
client.addHook((event) => {
  const maskedPayload = maskSensitiveData(event.payload);
  
  return {
    ...event,
    payload: maskedPayload
  };
});

function maskSensitiveData(data: any): any {
  if (typeof data !== 'object') return data;
  
  const masked = { ...data };
  const sensitiveFields = ['password', 'token', 'api_key', 'ssn'];
  
  for (const field of sensitiveFields) {
    if (field in masked) {
      masked[field] = '***REDACTED***';
    }
  }
  
  return masked;
}
```

### Event Validation

Validate events before sending:

```typescript
client.addHook((event) => {
  if (!event.event_type) {
    throw new Error('Event type is required');
  }
  
  if (!event.payload) {
    throw new Error('Event payload is required');
  }
  
  return event;
});
```

### Event Filtering

Filter out unwanted events:

```typescript
client.addHook((event) => {
  // Skip debug events in production
  if (process.env.NODE_ENV === 'production' && event.event_type.startsWith('DEBUG_')) {
    return null; // Return null to skip
  }
  
  return event;
});
```

### Custom Logging

Add custom logging:

```typescript
client.addHook((event) => {
  console.log(`[Blocklog] Sending event: ${event.event_type}`, {
    payload: event.payload,
    metadata: event.metadata
  });
  
  return event;
});
```

## Multiple Middleware Hooks

Chain multiple middleware hooks:

```typescript
// Add enrichment
client.addHook(enrichEvent);

// Add validation
client.addHook(validateEvent);

// Add masking
client.addHook(maskSensitiveData);

// Add logging
client.addHook(logEvent);

// Events flow through hooks in the order they were added
```

## Async Middleware

Middleware can be asynchronous:

```typescript
client.addHook(async (event) => {
  // Perform async operation
  const additionalData = await fetchAdditionalContext(event);
  
  return {
    ...event,
    metadata: {
      ...event.metadata,
      ...additionalData
    }
  };
});
```

## Conditional Middleware

Apply middleware conditionally:

```typescript
client.addHook((event) => {
  // Only apply to certain event types
  if (!event.event_type.startsWith('AGENT_')) {
    return event;
  }
  
  // Apply transformation
  return {
    ...event,
    metadata: {
      ...event.metadata,
      agent_specific: true
    }
  };
});
```

## Middleware Error Handling

Handle errors in middleware:

```typescript
client.addHook((event) => {
  try {
    // Transform event
    return transformEvent(event);
  } catch (error) {
    console.error('Middleware error:', error);
    // Return original event on error
    return event;
  }
});
```

## Middleware Performance

Optimize middleware for performance:

```typescript
// Cache expensive operations
const cache = new Map();

client.addHook((event) => {
  const cacheKey = JSON.stringify(event.payload);
  
  if (cache.has(cacheKey)) {
    return {
      ...event,
      metadata: {
        ...event.metadata,
        cached: true
      }
    };
  }
  
  const result = expensiveOperation(event);
  cache.set(cacheKey, result);
  
  return {
    ...event,
    metadata: {
      ...event.metadata,
      ...result
    }
  };
});
```

## Middleware Best Practices

### 1. Keep Middleware Simple

```typescript
// Good - single responsibility
client.addHook(enrichWithUserId);
client.addHook(enrichWithSessionId);
client.addHook(enrichWithRequestId);

// Avoid - too complex
client.addHook((event) => {
  // Too many responsibilities
  const userId = getCurrentUserId();
  const sessionId = getSessionId();
  const requestId = generateRequestId();
  const masked = maskData(event.payload);
  const validated = validateData(masked);
  const enriched = enrichData(validated);
  return enriched;
});
```

### 2. Handle Errors Gracefully

```typescript
client.addHook((event) => {
  try {
    return transformEvent(event);
  } catch (error) {
    console.error('Middleware error:', error);
    return event; // Return original event
  }
});
```

### 3. Document Middleware

```typescript
/**
 * Adds user context to events
 */
client.addHook((event) => {
  return {
    ...event,
    metadata: {
      ...event.metadata,
      user_id: getCurrentUserId()
    }
  };
});
```

### 4. Test Middleware

```typescript
describe('Middleware', () => {
  it('should enrich events with user ID', () => {
    const event = { event_type: 'TEST', payload: {} };
    const enriched = userIdMiddleware(event);
    
    expect(enriched.metadata.user_id).toBeDefined();
  });
});
```

## Common Middleware Patterns

### Request ID Injection

```typescript
client.addHook((event) => {
  return {
    ...event,
    metadata: {
      ...event.metadata,
      request_id: getRequestId() || generateRequestId()
    }
  };
});
```

### Environment Tagging

```typescript
client.addHook((event) => {
  return {
    ...event,
    metadata: {
      ...event.metadata,
      environment: process.env.NODE_ENV || 'development',
      region: process.env.AWS_REGION || 'us-east-1'
    }
  };
});
```

### Version Tracking

```typescript
client.addHook((event) => {
  return {
    ...event,
    metadata: {
      ...event.metadata,
      app_version: process.env.APP_VERSION || '1.0.0',
      sdk_version: require('@blocklog/sdk/package.json').version
    }
  };
});
```

### Rate Limiting

```typescript
const rateLimiter = new Map();

client.addHook((event) => {
  const key = event.event_type;
  const now = Date.now();
  const window = 60000; // 1 minute
  const limit = 100;
  
  const requests = rateLimiter.get(key) || [];
  const recent = requests.filter(t => now - t < window);
  
  if (recent.length >= limit) {
    throw new Error(`Rate limit exceeded for ${key}`);
  }
  
  recent.push(now);
  rateLimiter.set(key, recent);
  
  return event;
});
```

## Troubleshooting

### Events Not Being Transformed

1. Verify middleware is added before events are sent
2. Check that middleware returns the event
3. Ensure middleware doesn't throw errors
4. Check middleware order

### Middleware Performance Issues

1. Profile middleware execution time
2. Cache expensive operations
3. Remove unnecessary middleware
4. Consider async operations

### Events Not Being Sent

1. Check if middleware returns null (filters event)
2. Verify middleware doesn't throw errors
3. Ensure middleware returns valid event structure
4. Check for validation errors

## Related Guides

- [Configuration Guide](../configuration.md) - SDK configuration
- [Event Pipeline](../architecture.md) - Understanding the event pipeline
- [Agent Tracing](agents.md) - Trace agent executions
