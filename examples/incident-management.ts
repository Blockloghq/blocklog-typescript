import { BlocklogClient } from '../src/index';

// Initialize the Blocklog client
const client = new BlocklogClient({
  apiKey: process.env.BLOCKLOG_API_KEY || 'your-api-key',
  endpoint: process.env.BLOCKLOG_ENDPOINT || 'https://api.blocklog.ai',
});

// Create an incident
async function createIncident(title: string, severity: string, description: string): Promise<any> {
  console.log(`Creating incident: ${title}`);
  console.log('Severity:', severity);
  
  const incident = await client.incidents.create({
    title: title,
    severity: severity,
    description: description,
    metadata: {
      created_by: 'system',
      environment: 'production'
    }
  });
  
  console.log('Incident created:', incident.id);
  
  return incident;
}

// Update incident status
async function updateIncident(incidentId: string, status: string): Promise<any> {
  console.log(`Updating incident: ${incidentId} to status: ${status}`);
  
  const result = await client.incidents.update(incidentId, { status });
  console.log('Incident updated:', result);
  
  return result;
}

// Assign incident
async function assignIncident(incidentId: string, assignee: string): Promise<any> {
  console.log(`Assigning incident ${incidentId} to ${assignee}`);
  
  const result = await client.incidents.assign(incidentId, assignee);
  console.log('Incident assigned:', result);
  
  return result;
}

// Resolve incident
async function resolveIncident(incidentId: string, reason: string): Promise<any> {
  console.log(`Resolving incident: ${incidentId}`);
  console.log('Reason:', reason);
  
  const result = await client.incidents.resolve(incidentId, reason);
  console.log('Incident resolved:', result);
  
  return result;
}

// Close incident
async function closeIncident(incidentId: string, reason: string): Promise<any> {
  console.log(`Closing incident: ${incidentId}`);
  console.log('Reason:', reason);
  
  const result = await client.incidents.close(incidentId, reason);
  console.log('Incident closed:', result);
  
  return result;
}

// Complete incident workflow
async function incidentWorkflow(error: Error, context: any): Promise<any> {
  console.log('=== Starting Incident Workflow ===');
  
  // Determine severity based on error
  let severity = 'low';
  if (error.message.includes('critical') || error.message.includes('security')) {
    severity = 'critical';
  } else if (error.message.includes('high') || error.message.includes('major')) {
    severity = 'high';
  } else if (error.message.includes('medium')) {
    severity = 'medium';
  }
  
  // Create incident
  const incident = await createIncident(
    `Agent error: ${error.name}`,
    severity,
    error.message
  );
  
  // Update status to investigating
  await updateIncident(incident.id, 'investigating');
  
  // Assign to team
  await assignIncident(incident.id, 'ai-team@company.com');
  
  // Simulate investigation
  console.log('Investigating incident...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Resolve incident
  await resolveIncident(incident.id, 'Fixed the underlying issue in agent logic');
  
  // Close incident
  await closeIncident(incident.id, 'Issue resolved and verified');
  
  // Get final incident details
  const finalIncident = await client.incidents.get(incident.id);
  console.log('Final incident:', finalIncident);
  
  return finalIncident;
}

// List incidents
async function listIncidents(severity?: string): Promise<any> {
  console.log('\n=== Listing Incidents ===');
  
  const params: any = {};
  if (severity) {
    params.severity = severity;
  }
  
  const incidents = await client.incidents.list(params);
  console.log(`Found ${incidents.length} incidents`);
  
  return incidents;
}

// Main execution
async function main() {
  try {
    // Create a sample incident
    const incident = await createIncident(
      'Agent execution failed',
      'high',
      'Trading agent encountered unexpected error during execution'
    );
    
    // List all incidents
    await listIncidents();
    
    // List high severity incidents
    await listIncidents('high');
    
    // Simulate incident workflow
    await incidentWorkflow(
      new Error('Agent execution failed: timeout'),
      { agent_id: 'trading-agent', input: 'test' }
    );
    
    // Flush events
    await client.flush();
    
    // Check health
    const health = await client.health();
    console.log('\nHealth status:', health);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Clean shutdown
    await client.shutdown();
    console.log('\nClient shutdown complete');
  }
}

// Run the example
main().catch(console.error);
