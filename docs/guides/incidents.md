# Incidents Guide

This guide covers how to track and manage AI incidents using the Blocklog TypeScript SDK.

## Overview

Incident management provides visibility into AI system failures and issues, including:
- Incident creation and tracking
- Incident classification and severity
- Incident resolution workflow
- Incident assignment and collaboration
- Incident history and analysis

## Creating Incidents

### Basic Incident Creation

```typescript
import { BlocklogClient } from '@blocklog/sdk';

const client = new BlocklogClient({ apiKey: 'your-api-key' });

await client.event('INCIDENT', {
  incident_id: 'incident-123',
  severity: 'high',
  title: 'Agent execution failed',
  description: 'Trading agent encountered unexpected error',
  timestamp: new Date().toISOString(),
});
```

### Using IncidentsClient

The SDK provides a dedicated API client for incident management:

```typescript
// Create an incident
await client.incidents.create({
  title: 'Agent failure',
  severity: 'high',
  description: 'Trading agent failed to execute',
  metadata: { agent_id: 'trading-agent' }
});

// Get an incident
const incident = await client.incidents.get('incident-123');

// List incidents
const incidents = await client.incidents.list({ severity: 'high', status: 'open' });

// Update an incident
await client.incidents.update('incident-123', { status: 'investigating' });

// Assign an incident
await client.incidents.assign('incident-123', 'user@company.com');

// Resolve an incident
await client.incidents.resolve('incident-123', 'Fixed the bug in agent logic');

// Close an incident
await client.incidents.close('incident-123', 'Issue resolved and verified');
```

## Incident Structure

Incidents include the following structure:

```typescript
{
  incident_id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  created_at: string;
  updated_at: string;
  assigned_to?: string;
  resolved_by?: string;
  resolution_reason?: string;
  metadata?: Record<string, any>;
}
```

## Incident Classification

Classify incidents by severity and type:

```typescript
await client.event('INCIDENT', {
  incident_id: 'incident-123',
  severity: 'critical',
  title: 'Agent produced harmful output',
  description: 'Agent generated inappropriate content',
  metadata: {
    incident_type: 'safety',
    category: 'content_safety',
    impact: 'high',
    affected_users: 100
  }
});
```

## Incident Workflow

### Complete Incident Workflow

```typescript
async function incidentWorkflow(error: Error, context: any) {
  // 1. Create incident
  const incident = await client.incidents.create({
    title: 'Agent execution failure',
    severity: 'high',
    description: error.message,
    metadata: {
      error_type: error.name,
      context: context
    }
  });

  console.log(`Incident created: ${incident.id}`);

  // 2. Assign to team
  await client.incidents.assign(incident.id, 'ai-team@company.com');

  // 3. Update status
  await client.incidents.update(incident.id, { status: 'investigating' });

  // 4. Resolve incident
  await client.incidents.resolve(incident.id, 'Fixed the underlying issue');

  // 5. Close incident
  await client.incidents.close(incident.id, 'Verified fix and deployed');
}
```

## Incident Assignment

Assign incidents to specific team members:

```typescript
await client.incidents.assign('incident-123', 'user@company.com');
```

## Incident Resolution

Track incident resolution process:

```typescript
async function resolveIncident(incidentId: string, resolution: string) {
  // Update status to investigating
  await client.incidents.update(incidentId, { status: 'investigating' });

  // Perform investigation
  const rootCause = await investigateIncident(incidentId);

  // Update with findings
  await client.incidents.update(incidentId, {
    metadata: { root_cause: rootCause }
  });

  // Resolve incident
  await client.incidents.resolve(incidentId, resolution);

  // Close incident
  await client.incidents.close(incidentId, 'Resolution verified');
}
```

## Incident History

Track incident history for analysis:

```typescript
async function getIncidentHistory(incidentId: string) {
  const incident = await client.incidents.get(incidentId);
  
  console.log('Incident timeline:', {
    created: incident.created_at,
    updated: incident.updated_at,
    assigned_to: incident.assigned_to,
    resolved_by: incident.resolved_by,
    resolution_reason: incident.resolution_reason
  });
}
```

## Incident Metrics

Track incident metrics for analysis:

```typescript
async function getIncidentMetrics() {
  const incidents = await client.incidents.list();
  
  const metrics = {
    total: incidents.length,
    by_severity: {
      critical: incidents.filter(i => i.severity === 'critical').length,
      high: incidents.filter(i => i.severity === 'high').length,
      medium: incidents.filter(i => i.severity === 'medium').length,
      low: incidents.filter(i => i.severity === 'low').length
    },
    by_status: {
      open: incidents.filter(i => i.status === 'open').length,
      investigating: incidents.filter(i => i.status === 'investigating').length,
      resolved: incidents.filter(i => i.status === 'resolved').length,
      closed: incidents.filter(i => i.status === 'closed').length
    },
    avg_resolution_time: calculateAverageResolutionTime(incidents)
  };
  
  console.log('Incident metrics:', metrics);
}
```

## Incident Integration with Agent Tracing

Integrate incidents with agent error handling:

```typescript
class RobustAgent {
  @traceAgent('robust-agent')
  async execute(input: string): Promise<string> {
    try {
      return await this.process(input);
    } catch (error) {
      // Create incident on error
      await client.incidents.create({
        title: 'Agent execution failed',
        severity: 'high',
        description: error.message,
        metadata: {
          agent_id: 'robust-agent',
          input: input,
          error: error.stack
        }
      });
      
      throw error;
    }
  }
}
```

## Automatic Incident Creation

Automatically create incidents based on error patterns:

```typescript
async function handleAgentError(error: Error, context: any) {
  const severity = determineSeverity(error);
  
  if (severity === 'critical' || severity === 'high') {
    await client.incidents.create({
      title: `Agent error: ${error.name}`,
      severity: severity,
      description: error.message,
      metadata: {
        error_type: error.name,
        context: context,
        automatic: true
      }
    });
  }
}

function determineSeverity(error: Error): 'low' | 'medium' | 'high' | 'critical' {
  if (error.message.includes('security')) return 'critical';
  if (error.message.includes('data loss')) return 'high';
  if (error.message.includes('timeout')) return 'medium';
  return 'low';
}
```

## Incident Escalation

Implement incident escalation policies:

```typescript
async function escalateIncident(incidentId: string) {
  const incident = await client.incidents.get(incidentId);
  
  // Increase severity
  const newSeverity = increaseSeverity(incident.severity);
  
  await client.incidents.update(incidentId, {
    severity: newSeverity,
    metadata: {
      escalated: true,
      escalated_at: new Date().toISOString(),
      previous_severity: incident.severity
    }
  });
  
  // Reassign to higher level
  await client.incidents.assign(incidentId, 'senior-team@company.com');
}
```

## Best Practices

### 1. Use Descriptive Incident Titles

```typescript
title: 'Trading agent failed to execute trade due to API timeout'  // Good
title: 'Agent error'  // Avoid - not specific
```

### 2. Include Complete Context

```typescript
await client.incidents.create({
  title: 'Agent failure',
  severity: 'high',
  description: error.message,
  metadata: {
    agent_id: 'trading-agent',
    input: input,
    environment: 'production',
    error_stack: error.stack,
    user_impact: 'high',
    affected_users: 50
  }
});
```

### 3. Assign Appropriate Severity

```typescript
severity: 'critical'  // Security issues, data loss
severity: 'high'  # Major functionality broken
severity: 'medium'  # Partial functionality affected
severity: 'low'  # Minor issues, workarounds available
```

### 4. Track Resolution Time

```typescript
async function trackResolutionTime(incidentId: string) {
  const incident = await client.incidents.get(incidentId);
  
  const resolutionTime = Date.now() - new Date(incident.created_at).getTime();
  
  await client.incidents.update(incidentId, {
    metadata: {
      resolution_time_ms: resolutionTime,
      resolution_hours: resolutionTime / (1000 * 60 * 60)
    }
  });
}
```

## Troubleshooting

### Incidents Not Created

1. Verify incident data is valid
2. Check API permissions
3. Ensure title and description are provided
4. Check network connectivity

### Incident Status Not Updating

1. Verify incident ID is correct
2. Check user permissions for updates
3. Ensure status value is valid
4. Check for concurrent modifications

### Assignment Not Working

1. Verify assignee email is valid
2. Check assignee permissions
3. Ensure incident is in assignable state
4. Check notification system

## Related Guides

- [Agent Tracing](agents.md) - Trace agent executions
- [Decision Recording](decisions.md) - Record decision points
- [Compliance Guide](compliance.md) - Compliance reporting
