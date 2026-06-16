# Configuration Guide

This guide covers all configuration options for the Blocklog TypeScript SDK.

## Constructor Options

```typescript
import { BlocklogClient } from '@blocklog/sdk';

const client = new BlocklogClient({
  apiKey: 'your-api-key',
  endpoint: 'base_url',
  batchSize: 100,
  flushInterval: 5000,
  timeout: 30000,
  retryCount: 3,
  enableSigning: false,
  signingKey: undefined,
  signingAlg: 'hmac-sha256',
  enableCompression: true,
  debug: false,
});
```

## Configuration Options

### Required Options

| Option | Type | Description |
|--------|------|-------------|
| `apiKey` | `string` | Your Blocklog API key |

### Optional Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `endpoint` | `string` | `base_url` | Blocklog API endpoint URL |
| `batchSize` | `number` | `100` | Number of events to batch before sending |
| `flushInterval` | `number` | `5000` | Auto-flush interval in milliseconds |
| `timeout` | `number` | `30000` | HTTP request timeout in milliseconds |
| `retryCount` | `number` | `3` | Number of retry attempts for failed requests |
| `enableSigning` | `boolean` | `false` | Enable event signing for integrity verification |
| `signingKey` | `string` | `undefined` | Private key for event signing |
| `signingAlg` | `'hmac-sha256' \| 'ed25519'` | `'hmac-sha256'` | Signing algorithm to use |
| `enableCompression` | `boolean` | `true` | Enable request compression |
| `debug` | `boolean` | `false` | Enable debug logging |

## Environment Variables

Configuration can also be provided via environment variables:

| Environment Variable | Description |
|---------------------|-------------|
| `BLOCKLOG_API_KEY` | Your Blocklog API key |
| `BLOCKLOG_ENDPOINT` | Blocklog API endpoint URL |
| `BLOCKLOG_BATCH_SIZE` | Event batch size |
| `BLOCKLOG_FLUSH_INTERVAL` | Auto-flush interval in milliseconds |
| `BLOCKLOG_TIMEOUT` | HTTP request timeout in milliseconds |
| `BLOCKLOG_RETRY_COUNT` | Number of retry attempts |
| `BLOCKLOG_ENABLE_SIGNING` | Enable event signing (`true`/`false`) |
| `BLOCKLOG_SIGNING_KEY` | Private key for event signing |
| `BLOCKLOG_SIGNING_ALG` | Signing algorithm |
| `BLOCKLOG_ENABLE_COMPRESSION` | Enable compression (`true`/`false`) |
| `BLOCKLOG_DEBUG` | Enable debug logging (`true`/`false`) |

### Priority

Constructor options take precedence over environment variables:

```typescript
// Constructor option overrides environment variable
const client = new BlocklogClient({
  apiKey: 'constructor-key', // Used even if BLOCKLOG_API_KEY is set
  endpoint: 'https://custom.endpoint.com', // Used even if BLOCKLOG_ENDPOINT is set
});
```

## Event Signing

Event signing provides integrity verification for your events. Configure signing to ensure events haven't been tampered with.

### HMAC-SHA256 Signing

```typescript
const client = new BlocklogClient({
  apiKey: 'your-api-key',
  enableSigning: true,
  signingKey: 'your-secret-key',
  signingAlg: 'hmac-sha256',
});
```

### Ed25519 Signing

```typescript
const { generateKeyPairSync } = require('crypto');
const { privateKey } = generateKeyPairSync('ed25519');
const privateKeyPem = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();

const client = new BlocklogClient({
  apiKey: 'your-api-key',
  enableSigning: true,
  signingKey: privateKeyPem,
  signingAlg: 'ed25519',
});
```

## Batching and Flushing

### Batching

Events are automatically batched to reduce API calls:

```typescript
const client = new BlocklogClient({
  apiKey: 'your-api-key',
  batchSize: 50, // Send batches of 50 events
});
```

### Auto-Flush

Events are automatically flushed on a timer:

```typescript
const client = new BlocklogClient({
  apiKey: 'your-api-key',
  flushInterval: 10000, // Flush every 10 seconds
});
```

### Manual Flush

You can manually flush events at any time:

```typescript
await client.flush();
```

## Retry Configuration

Configure retry behavior for failed requests:

```typescript
const client = new BlocklogClient({
  apiKey: 'your-api-key',
  retryCount: 5, // Retry up to 5 times
  timeout: 60000, // 60 second timeout
});
```

### Retry Behavior

- **429 Rate Limit**: Automatically retries with exponential backoff
- **500 Server Errors**: Automatically retries up to `retryCount`
- **4xx Client Errors**: Does not retry (except 429)
- **Network Errors**: Automatically retries up to `retryCount`

## Dependency Injection

For advanced use cases, you can inject custom dependencies:

```typescript
import { BlocklogClient } from '@blocklog/sdk';
import { SyncTransport } from '@blocklog/sdk/transport';
import { MemoryQueue } from '@blocklog/sdk/queue';

const customTransport = new SyncTransport({
  baseUrl: 'https://custom.endpoint.com',
  apiKey: 'your-api-key',
  timeout: 60000,
});

const customQueue = new MemoryQueue();

const client = new BlocklogClient(
  { apiKey: 'your-api-key' },
  {
    transport: customTransport,
    memoryQueue: customQueue,
  }
);
```

## Debug Mode

Enable debug mode for detailed logging:

```typescript
const client = new BlocklogClient({
  apiKey: 'your-api-key',
  debug: true,
});
```

Or via environment variable:

```bash
BLOCKLOG_DEBUG=true
```

## Configuration Validation

The SDK validates configuration at initialization:

```typescript
import { BlocklogClient } from '@blocklog/sdk';

try {
  const client = new BlocklogClient({
    apiKey: '', // Invalid: empty string
  });
} catch (error) {
  console.error('Configuration error:', error);
}
```

### Validation Rules

- `apiKey` must be a non-empty string
- `endpoint` must be a valid URL
- `batchSize` must be a positive integer
- `flushInterval` must be a positive integer
- `timeout` must be a positive integer
- `retryCount` must be a non-negative integer
- `signingAlg` must be either `'hmac-sha256'` or `'ed25519'`

## Best Practices

### Production Configuration

```typescript
const client = new BlocklogClient({
  apiKey: process.env.BLOCKLOG_API_KEY,
  endpoint: process.env.BLOCKLOG_ENDPOINT || 'base_url',
  batchSize: 100,
  flushInterval: 5000,
  retryCount: 3,
  enableSigning: true,
  signingKey: process.env.BLOCKLOG_SIGNING_KEY,
  signingAlg: 'hmac-sha256',
  enableCompression: true,
  debug: false,
});
```

### Development Configuration

```typescript
const client = new BlocklogClient({
  apiKey: 'dev-api-key',
  endpoint: 'https://dev-api.blocklog.ai',
  batchSize: 10,
  flushInterval: 1000,
  retryCount: 1,
  debug: true,
});
```

### Testing Configuration

```typescript
const client = new BlocklogClient({
  apiKey: 'test-api-key',
  endpoint: 'http://localhost:3000',
  batchSize: 1,
  flushInterval: 0, // Disable auto-flush
  retryCount: 0, // Disable retries
  debug: true,
});
```

## Next Steps

- [Architecture](architecture.md) - Understand the SDK architecture
- [Feature Guides](guides/) - Explore specific features
- [Integration Guides](integrations/) - Integrate with popular frameworks
