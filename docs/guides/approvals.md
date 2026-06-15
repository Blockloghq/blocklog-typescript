# Approvals Guide

This guide covers how to implement human-in-the-loop approval workflows using the Blocklog TypeScript SDK.

## Overview

Approval workflows enable human oversight of critical AI decisions, including:
- Approval request creation
- Approval status tracking
- Approver assignment
- Approval history
- Integration with decision recording

## Creating Approval Requests

### Basic Approval Request

```typescript
import { BlocklogClient } from '@blocklog/sdk';

const client = new BlocklogClient({ apiKey: 'your-api-key' });

await client.approvals.create({
  decisionId: 'decision-123',
  reason: 'High value trade requires approval'
});
```

### Using ApprovalClient

The SDK provides a dedicated API client for approval management:

```typescript
// Create approval request
const approval = await client.approvals.create({
  decisionId: 'decision-123',
  reason: 'Requires human review'
});

// Approve a request
await client.approvals.approve(approval.id, 'Approved based on risk analysis');

// Reject a request
await client.approvals.reject(approval.id, 'Does not meet criteria');

// Check approval status
const status = await client.approvals.status(approval.id);

// List approval requests
const approvals = await client.approvals.list({ status: 'pending' });
```

## Approval Structure

Approval requests include the following structure:

```typescript
{
  approval_id: string;
  decision_id: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  requested_by: string;
  approved_by?: string;
  rejected_by?: string;
  approval_reason?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}
```

## Approval Workflow

### Complete Approval Workflow

```typescript
async function approvalWorkflow(decisionId: string, decisionData: any) {
  // 1. Create approval request
  const approval = await client.approvals.create({
    decisionId: decisionId,
    reason: 'High value trade requires approval'
  });

  console.log(`Approval request created: ${approval.id}`);

  // 2. Poll for approval status
  let status = await client.approvals.status(approval.id);
  
  while (status.status === 'pending') {
    await new Promise(resolve => setTimeout(resolve, 5000));
    status = await client.approvals.status(approval.id);
  }

  // 3. Handle approval result
  if (status.status === 'approved') {
    console.log('Decision approved:', status.approval_reason);
    // Execute the approved decision
    await executeDecision(decisionData);
  } else {
    console.log('Decision rejected:', status.rejection_reason);
    // Handle rejection
    await handleRejection(decisionData);
  }
}
```

## Approval Assignment

Assign specific approvers to requests:

```typescript
await client.approvals.create({
  decisionId: 'decision-123',
  reason: 'Requires manager approval',
  metadata: {
    required_approver: 'manager@company.com',
    approver_role: 'manager',
    approval_level: 'manager'
  }
});
```

## Approval Policies

Implement approval policies based on decision criteria:

```typescript
async function checkApprovalRequired(decision: any): Promise<boolean> {
  const policies = [
    { condition: (d) => d.amount > 10000, reason: 'High value' },
    { condition: (d) => d.risk_level === 'high', reason: 'High risk' },
    { condition: (d) => d.requires_compliance, reason: 'Compliance check' }
  ];

  for (const policy of policies) {
    if (policy.condition(decision)) {
      return true;
    }
  }

  return false;
}

async function executeWithApproval(decision: any) {
  if (await checkApprovalRequired(decision)) {
    const approval = await client.approvals.create({
      decisionId: decision.id,
      reason: 'Requires approval based on policy'
    });

    // Wait for approval
    const status = await client.approvals.status(approval.id);
    
    if (status.status === 'approved') {
      await executeDecision(decision);
    }
  } else {
    await executeDecision(decision);
  }
}
```

## Approval History

Track approval history for audit trails:

```typescript
async function recordApprovalHistory(decisionId: string) {
  // Create initial request
  const approval1 = await client.approvals.create({
    decisionId: decisionId,
    reason: 'Initial approval request'
  });

  // Request additional review
  const approval2 = await client.approvals.create({
    decisionId: decisionId,
    reason: 'Escalated to senior approver'
  });

  // List all approvals for decision
  const approvals = await client.approvals.list({
    decisionId: decisionId
  });

  console.log('Approval history:', approvals);
}
```

## Approval Notifications

Integrate approval requests with notification systems:

```typescript
async function notifyApprovers(approval: any) {
  // Send email notification
  await sendEmail({
    to: approval.approver_email,
    subject: 'Approval Required',
    body: `Please review decision ${approval.decisionId}`
  });

  // Send Slack notification
  await sendSlackMessage({
    channel: '#approvals',
    text: `New approval request: ${approval.decisionId}`
  });
}

async function createApprovalWithNotification(decisionId: string) {
  const approval = await client.approvals.create({
    decisionId: decisionId,
    reason: 'Requires approval'
  });

  await notifyApprovers(approval);
  return approval;
}
```

## Approval Integration with Decisions

Integrate approvals with decision recording:

```typescript
async function decisionWithApproval(decisionData: any) {
  const decisionId = `decision-${Date.now()}`;
  
  // Record initial decision as pending
  await client.event('DECISION', {
    decision_type: 'trade',
    decision_id: decisionId,
    input: decisionData,
    output: { status: 'pending_approval' },
    metadata: { requires_approval: true }
  });

  // Request approval
  const approval = await client.approvals.create({
    decisionId: decisionId,
    reason: 'High value trade'
  });

  // Wait for approval
  const status = await client.approvals.status(approval.id);
  
  // Update decision based on approval
  if (status.status === 'approved') {
    await client.decisions.update(decisionId, {
      output: {
        status: 'approved',
        approved_by: status.approved_by,
        approval_reason: status.approval_reason
      }
    });
  } else {
    await client.decisions.update(decisionId, {
      output: {
        status: 'rejected',
        rejected_by: status.rejected_by,
        rejection_reason: status.rejection_reason
      }
    });
  }
}
```

## Approval Delegation

Support approval delegation:

```typescript
async function delegateApproval(approvalId: string, delegateTo: string) {
  await client.approvals.update(approvalId, {
    delegated_to: delegateTo,
    delegated_at: new Date().toISOString()
  });
}
```

## Approval Expiration

Set expiration times for approval requests:

```typescript
await client.approvals.create({
  decisionId: 'decision-123',
  reason: 'Requires approval',
  metadata: {
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    expiration_hours: 24
  }
});
```

## Best Practices

### 1. Provide Clear Approval Reasons

```typescript
await client.approvals.create({
  decisionId: 'decision-123',
  reason: 'Trade exceeds $100,000 threshold - requires CFO approval'  // Good
});

await client.approvals.create({
  decisionId: 'decision-123',
  reason: 'Needs approval'  // Avoid - not specific
});
```

### 2. Include Relevant Context

```typescript
await client.approvals.create({
  decisionId: 'decision-123',
  reason: 'High value trade',
  metadata: {
    amount: 150000,
    symbol: 'AAPL',
    risk_level: 'high',
    portfolio_impact: 'significant'
  }
});
```

### 3. Set Appropriate Timeouts

```typescript
await client.approvals.create({
  decisionId: 'decision-123',
  reason: 'Requires approval',
  metadata: {
    expires_at: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    urgency: 'high'
  }
});
```

### 4. Track Approval Metrics

```typescript
async function trackApprovalMetrics() {
  const approvals = await client.approvals.list();
  
  const metrics = {
    total: approvals.length,
    approved: approvals.filter(a => a.status === 'approved').length,
    rejected: approvals.filter(a => a.status === 'rejected').length,
    pending: approvals.filter(a => a.status === 'pending').length,
    avg_approval_time: calculateAverageApprovalTime(approvals)
  };
  
  console.log('Approval metrics:', metrics);
}
```

## Troubleshooting

### Approval Requests Not Created

1. Verify decisionId exists
2. Check API permissions
3. Ensure reason is provided
4. Check network connectivity

### Approval Status Not Updating

1. Verify approval ID is correct
2. Check approver permissions
3. Ensure approval reason is provided
4. Check for concurrent modifications

### Approval Notifications Not Sent

1. Verify notification system configuration
2. Check approver email addresses
3. Ensure notification service is available
4. Check notification rate limits

## Related Guides

- [Decision Recording](decisions.md) - Record decision points
- [Agent Tracing](agents.md) - Trace agent executions
- [Incidents Guide](incidents.md) - Incident management
