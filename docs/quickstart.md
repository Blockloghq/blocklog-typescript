# Quickstart

Welcome to the Blocklog TypeScript SDK. This SDK provides complete traceability, governance, and compliance for AI agent decisions.

## Installation

```bash
npm install @blocklog/sdk
```

## Initialization

Initialize the SDK at the entry point of your application:

```typescript
import blocklog from '@blocklog/sdk';

blocklog.init({
  apiKey: 'blk_test_...',
});
```

## Tracing an Agent

Use the `@blocklog.agent` decorator to automatically trace agent execution:

```typescript
class TradingAgent {
  @blocklog.agent({ name: 'trading-agent' })
  async run() {
    // ...
  }
}
```

Or use the HOF wrapper:

```typescript
await blocklog.agent('trading-agent')(async () => {
  // ...
});
```

## Tracking Decisions

Record structured decisions with inputs, outputs, tags, and request approvals if necessary:

```typescript
await blocklog.decision({ type: 'TRADE' }, async (decision) => {
  decision.recordInput({ symbol: 'AAPL' });
  decision.recordOutput({ action: 'BUY' });
  
  await decision.requestApproval({ reason: 'High volatility' });
});
```

## Auto-Instrumentation

Blocklog supports native integrations with major frameworks:

```typescript
// LangChain
blocklog.instrumentLangChain();

// LangGraph
blocklog.instrumentLangGraph();

// OpenAI Agents
blocklog.instrumentOpenAIAgents();
```
