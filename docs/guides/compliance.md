# Compliance Guide

This guide covers how to implement compliance reporting and auditing using the Blocklog TypeScript SDK.

## Overview

Compliance features provide automated compliance reporting and evidence export, including:
- Compliance audit generation
- Compliance verification
- Evidence export
- Dashboard metrics
- Report sharing

## Compliance Audits

### Creating Compliance Audits

```typescript
import { BlocklogClient } from '@blocklog/sdk';

const client = new BlocklogClient({ apiKey: 'your-api-key' });

await client.compliance.audit({
  start_date: '2024-01-01',
  end_date: '2024-01-31',
  regulations: ['GDPR', 'SOC2'],
  scope: ['data_access', 'decision_logging']
});
```

### Using ComplianceClient

The SDK provides a dedicated API client for compliance management:

```typescript
// Create compliance audit
await client.compliance.audit({
  start_date: '2024-01-01',
  end_date: '2024-01-31',
  regulations: ['GDPR']
});

// Get compliance report
const report = await client.compliance.getReport('report-123');

// Get compliance dashboard
const dashboard = await client.compliance.getDashboard({
  time_range: '30d'
});

// Share compliance report
await client.compliance.shareReport('report-123', ['compliance@company.com']);

// Export evidence
await client.compliance.exportEvidence('report-123', 'pdf');

// Verify compliance
const verification = await client.compliance.verify('audit-123');

// Export compliance data
await client.compliance.export({
  format: 'csv',
  date_range: { start: '2024-01-01', end: '2024-01-31' }
});
```

## Compliance Audit Structure

Compliance audits include the following structure:

```typescript
{
  audit_id: string;
  start_date: string;
  end_date: string;
  regulations: string[];
  scope: string[];
  status: 'in_progress' | 'completed' | 'failed';
  findings: ComplianceFinding[];
  score: number;
  created_at: string;
  completed_at?: string;
}
```

## Compliance Verification

Verify compliance with regulations:

```typescript
const verification = await client.compliance.verify('audit-123');

if (verification.compliant) {
  console.log('System is compliant');
} else {
  console.log('Compliance issues found:', verification.issues);
}
```

## Compliance Dashboard

Get compliance metrics and dashboard data:

```typescript
const dashboard = await client.compliance.getDashboard({
  time_range: '30d',
  regulations: ['GDPR', 'SOC2']
});

console.log('Compliance score:', dashboard.score);
console.log('Open issues:', dashboard.open_issues);
console.log('Resolved issues:', dashboard.resolved_issues);
```

## Evidence Export

Export compliance evidence in various formats:

```typescript
// Export as PDF
await client.compliance.exportEvidence('report-123', 'pdf');

// Export as CSV
await client.compliance.exportEvidence('report-123', 'csv');

// Export as JSON
await client.compliance.exportEvidence('report-123', 'json');
```

## Report Sharing

Share compliance reports with stakeholders:

```typescript
await client.compliance.shareReport('report-123', [
  'compliance@company.com',
  'legal@company.com',
  'management@company.com'
]);
```

## Compliance Scopes

Define compliance audit scopes:

```typescript
await client.compliance.audit({
  start_date: '2024-01-01',
  end_date: '2024-01-31',
  regulations: ['GDPR'],
  scope: [
    'data_access',      // Data access logging
    'decision_logging', // Decision recording
    'approval_workflows', // Approval tracking
    'incident_management', // Incident handling
    'data_retention'    // Data retention policies
  ]
});
```

## Compliance Regulations

Support for common compliance frameworks:

```typescript
await client.compliance.audit({
  start_date: '2024-01-01',
  end_date: '2024-01-31',
  regulations: [
    'GDPR',        // General Data Protection Regulation
    'SOC2',        // Service Organization Control 2
    'HIPAA',       // Health Insurance Portability and Accountability Act
    'PCI-DSS',     // Payment Card Industry Data Security Standard
    'ISO27001'     // Information Security Management
  ]
});
```

## Automated Compliance Checks

Implement automated compliance checks:

```typescript
async function checkCompliance(decision: any): Promise<boolean> {
  const checks = [
    checkDataAccessCompliance(decision),
    checkDecisionLoggingCompliance(decision),
    checkApprovalWorkflowCompliance(decision)
  ];

  const results = await Promise.all(checks);
  return results.every(result => result === true);
}

async function checkDataAccessCompliance(decision: any): Promise<boolean> {
  // Check if data access is properly logged
  const hasAccessLog = decision.metadata?.access_logged;
  return hasAccessLog === true;
}
```

## Compliance Scoring

Calculate compliance scores:

```typescript
async function calculateComplianceScore(auditId: string): Promise<number> {
  const verification = await client.compliance.verify(auditId);
  
  const score = verification.issues.reduce((total, issue) => {
    return total - issue.severity_weight;
  }, 100);
  
  return Math.max(0, score);
}
```

## Compliance Reporting

Generate compliance reports:

```typescript
async function generateComplianceReport(startDate: string, endDate: string) {
  const audit = await client.compliance.audit({
    start_date: startDate,
    end_date: endDate,
    regulations: ['GDPR', 'SOC2']
  });

  const report = await client.compliance.getReport(audit.id);
  
  return {
    audit_id: audit.id,
    score: audit.score,
    findings: audit.findings,
    recommendations: audit.recommendations,
    generated_at: new Date().toISOString()
  };
}
```

## Best Practices

### 1. Define Clear Scopes

```typescript
scope: [
  'data_access',           // Specific and clear
  'decision_logging',      // Specific and clear
  'approval_workflows'     // Specific and clear
]

// Avoid
scope: ['all']  // Too broad
```

### 2. Use Appropriate Regulations

```typescript
regulations: ['GDPR', 'SOC2']  // Specific frameworks

// Avoid
regulations: ['compliance']  // Too vague
```

### 3. Regular Compliance Audits

```typescript
// Schedule regular compliance audits
setInterval(async () => {
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  await client.compliance.audit({
    start_date: startDate.toISOString().split('T')[0],
    end_date: endDate.toISOString().split('T')[0],
    regulations: ['GDPR', 'SOC2']
  });
}, 30 * 24 * 60 * 60 * 1000); // Every 30 days
```

### 4. Track Compliance Metrics

```typescript
async function trackComplianceMetrics() {
  const dashboard = await client.compliance.getDashboard({
    time_range: '90d'
  });
  
  console.log('Compliance metrics:', {
    score: dashboard.score,
    trend: dashboard.score_trend,
    open_issues: dashboard.open_issues,
    resolved_issues: dashboard.resolved_issues,
    avg_resolution_time: dashboard.avg_resolution_time
  });
}
```

## Integration with Decision Recording

Integrate compliance checks with decision recording:

```typescript
async function recordCompliantDecision(decisionData: any) {
  // Check compliance before recording
  const isCompliant = await checkCompliance(decisionData);
  
  if (!isCompliant) {
    throw new Error('Decision does not meet compliance requirements');
  }
  
  // Record compliant decision
  await client.event('DECISION', {
    decision_type: 'compliant_decision',
    decision_id: `decision-${Date.now()}`,
    input: decisionData.input,
    output: decisionData.output,
    metadata: {
      compliance_verified: true,
      compliance_score: 100
    }
  });
}
```

## Troubleshooting

### Compliance Audits Not Created

1. Verify date range is valid
2. Check that regulations are supported
3. Ensure scope is properly defined
4. Check API permissions

### Verification Failing

1. Check that audit has completed
2. Verify audit ID is correct
3. Ensure compliance requirements are met
4. Check for configuration issues

### Export Not Working

1. Verify format is supported
2. Check that report exists
3. Ensure export permissions
4. Check file system permissions

## Related Guides

- [Decision Recording](decisions.md) - Record decision points
- [Incidents Guide](incidents.md) - Incident management
- [Approvals Guide](approvals.md) - Human-in-the-loop workflows
