# Decision Recording Guide

This guide covers how to record and track AI decision points using the Blocklog TypeScript SDK.

## Overview

Decision recording provides visibility into AI decision-making processes, including:
- Decision inputs and outputs
- Decision context and metadata
- Decision approval workflows
- Decision history and audit trails
- Decision search and analysis

## Recording Decisions

### Basic Decision Recording

```typescript
import { BlocklogClient } from '@blocklog/sdk';

const client = new BlocklogClient({ apiKey: 'your-api-key' });

await client.event('DECISION', {
  decision_type: 'trade_approval',
  decision_id: 'decision-123',
  input: { symbol: 'AAPL', action: 'BUY', quantity: 100 },
  output: { approved: true, reason: 'Meets criteria' },
  timestamp: new Date().toISOString(),
});
```

### Using DecisionsClient

The SDK provides a dedicated API client for decision management:

```typescript
// Create a decision
await client.decisions.create({
  type: 'approval',
  input: { symbol: 'AAPL', action: 'BUY' },
  output: { approved: true },
  metadata: { risk_level: 'medium' }
});

// Get a decision
const decision = await client.decisions.get('decision-123');

// List decisions
const decisions = await client.decisions.list({ limit: 10, type: 'approval' });

// Search decisions
const results = await client.decisions.search({ query: 'AAPL' });

// Update a decision
await client.decisions.update('decision-123', { status: 'approved' });

// Verify a decision
const verification = await client.decisions.verify('decision-123');
```

## Decision Structure

Decisions include the following structure:

```typescript
{
  decision_type: string;
  decision_id: string;
  input: Record<string, any>;
  output: Record<string, any>;
  context?: Record<string, any>;
  metadata?: Record<string, any>;
  timestamp: string;
  trace_id?: string;
  span_id?: string;
}
```

## Decision Categories

Organize decisions by category for better filtering:

```typescript
await client.event('DECISION', {
  decision_type: 'financial',
  decision_id: 'fin-123',
  input: { amount: 10000, currency: 'USD' },
  output: { approved: true },
  metadata: { category: 'loan_approval' }
});

await client.event('DECISION', {
  decision_type: 'compliance',
  decision_id: 'comp-456',
  input: { regulation: 'GDPR', data_type: 'PII' },
  output: { compliant: true },
  metadata: { category: 'data_access' }
});
```

## Decision Context

Include context for better decision understanding:

```typescript
await client.event('DECISION', {
  decision_type: 'trade',
  decision_id: 'trade-789',
  input: { symbol: 'AAPL', action: 'BUY', quantity: 100 },
  output: { approved: true },
  context: {
    market_conditions: 'bullish',
    portfolio_risk: 'medium',
    user_profile: 'aggressive_investor'
  },
  metadata: { strategy: 'momentum' }
});
```

## Decision Approval Integration

Integrate decisions with approval workflows:

```typescript
async function makeDecisionWithApproval(input: any) {
  // Record initial decision
  const decisionId = `decision-${Date.now()}`;
  
  await client.event('DECISION', {
    decision_type: 'high_value_trade',
    decision_id: decisionId,
    input: input,
    output: { status: 'pending_approval' },
    metadata: { requires_approval: true }
  });

  // Request approval
  const approval = await client.approvals.create({
    decisionId: decisionId,
    reason: 'High value trade requires approval'
  });

  // Wait for approval
  const status = await client.approvals.status(approval.id);
  
  if (status.status === 'approved') {
    // Update decision with approval
    await client.decisions.update(decisionId, {
      output: { approved: true, approved_by: status.approver }
    });
  } else {
    await client.decisions.update(decisionId, {
      output: { approved: false, reason: status.reason }
    });
  }
}
```

## Decision History

Track decision history for analysis:

```typescript
async function recordDecisionHistory(decisionId: string) {
  const history = [];
  
  // Initial decision
  await client.event('DECISION', {
    decision_id: decisionId,
    decision_type: 'initial',
    input: { data: 'initial' },
    output: { result: 'pending' },
    metadata: { step: 1 }
  });
  
  // Review decision
  await client.event('DECISION', {
    decision_id: decisionId,
    decision_type: 'review',
    input: { previous_output: 'pending' },
    output: { result: 'approved' },
    metadata: { step: 2 }
  });
  
  // Final decision
  await client.event('DECISION', {
    decision_id: decisionId,
    decision_type: 'final',
    input: { previous_output: 'approved' },
    output: { result: 'executed' },
    metadata: { step: 3 }
  });
}
```

## Decision Metadata

Use metadata for decision classification:

```typescript
await client.event('DECISION', {
  decision_type: 'trade',
  decision_id: 'trade-123',
  input: { symbol: 'AAPL', action: 'BUY' },
  output: { approved: true },
  metadata: {
    risk_level: 'high',
    confidence: 0.85,
    model_version: 'v2.1',
    automated: true,
    requires_human_review: false
  }
});
```

## Decision Search

Search decisions using the DecisionsClient:

```typescript
// Search by type
const financialDecisions = await client.decisions.search({
  decision_type: 'financial'
});

// Search by date range
const recentDecisions = await client.decisions.search({
  start_date: '2024-01-01',
  end_date: '2024-01-31'
});

// Search by metadata
const highRiskDecisions = await client.decisions.search({
  metadata: { risk_level: 'high' }
});
```

## Decision Verification

Verify decision integrity and compliance:

```typescript
const verification = await client.decisions.verify('decision-123');

if (verification.valid) {
  console.log('Decision is valid');
} else {
  console.log('Decision verification failed:', verification.reason);
}
```

## Best Practices

### 1. Use Descriptive Decision Types

```typescript
decision_type: 'high_value_trade_approval'  // Good
decision_type: 'decision'  // Avoid - too generic
```

### 2. Include Complete Input/Output

```typescript
await client.event('DECISION', {
  decision_type: 'loan_approval',
  decision_id: 'loan-123',
  input: {
    applicant: 'John Doe',
    amount: 50000,
    credit_score: 750,
    income: 75000,
    debt_to_income: 0.3
  },
  output: {
    approved: true,
    interest_rate: 5.5,
    term_months: 36
  }
});
```

### 3. Add Relevant Context

```typescript
await client.event('DECISION', {
  decision_type: 'trade',
  decision_id: 'trade-123',
  input: { symbol: 'AAPL', action: 'BUY' },
  output: { approved: true },
  context: {
    market_conditions: 'volatile',
    portfolio_exposure: 'high',
    regulatory_environment: 'normal'
  }
});
```

### 4. Use Consistent Decision IDs

```typescript
// Use consistent ID format
const decisionId = `trade-${Date.now()}-${symbol}`;

// Or use UUID
import { v4 as uuidv4 } from 'uuid';
const decisionId = uuidv4();
```

## Integration with Agent Tracing

Decisions can be recorded within agent executions:

```typescript
class TradingAgent {
  @traceAgent('trading-agent')
  async execute(signal: TradeSignal): Promise<Trade> {
    // Record decision within agent execution
    const decisionId = `decision-${Date.now()}`;
    
    await client.event('DECISION', {
      decision_type: 'trade_execution',
      decision_id: decisionId,
      input: signal,
      output: { action: signal.action },
      trace_id: TraceManager.currentSpan()?.traceId
    });
    
    return this.executeTrade(signal);
  }
}
```

## Troubleshooting

### Decisions Not Appearing

1. Verify decision event type is correct
2. Check that decision_id is unique
3. Ensure input/output are serializable
4. Check network connectivity

### Search Not Working

1. Verify search parameters are correct
2. Check that decisions have been recorded
3. Ensure metadata is properly structured
4. Check API permissions

### Verification Failing

1. Check decision integrity
2. Verify signing configuration
3. Ensure decision hasn't been tampered with
4. Check verification endpoint availability

## Related Guides

- [Agent Tracing](agents.md) - Trace agent executions
- [Approvals Guide](approvals.md) - Human-in-the-loop workflows
- [Compliance Guide](compliance.md) - Compliance reporting
