import { BlocklogClient } from '../src/index';

// Initialize the Blocklog client
const client = new BlocklogClient({
  apiKey: process.env.BLOCKLOG_API_KEY || 'your-api-key',
  endpoint: process.env.BLOCKLOG_ENDPOINT || 'https://api.blocklog.ai',
});

// Create a compliance audit
async function createComplianceAudit(startDate: string, endDate: string, regulations: string[]): Promise<any> {
  console.log(`Creating compliance audit from ${startDate} to ${endDate}`);
  console.log('Regulations:', regulations);
  
  const audit = await client.compliance.audit({
    start_date: startDate,
    end_date: endDate,
    regulations: regulations,
    scope: ['data_access', 'decision_logging', 'approval_workflows']
  });
  
  console.log('Audit created:', audit.id);
  
  return audit;
}

// Get compliance report
async function getComplianceReport(reportId: string): Promise<any> {
  console.log(`Getting compliance report: ${reportId}`);
  
  const report = await client.compliance.getReport(reportId);
  console.log('Compliance report:', report);
  
  return report;
}

// Get compliance dashboard
async function getComplianceDashboard(timeRange: string): Promise<any> {
  console.log(`Getting compliance dashboard for ${timeRange}`);
  
  const dashboard = await client.compliance.getDashboard({
    time_range: timeRange
  });
  
  console.log('Compliance dashboard:', dashboard);
  
  return dashboard;
}

// Share compliance report
async function shareComplianceReport(reportId: string, emails: string[]): Promise<any> {
  console.log(`Sharing compliance report ${reportId} with:`, emails);
  
  const result = await client.compliance.shareReport(reportId, emails);
  console.log('Report shared:', result);
  
  return result;
}

// Export compliance evidence
async function exportComplianceEvidence(reportId: string, format: string): Promise<any> {
  console.log(`Exporting compliance evidence ${reportId} as ${format}`);
  
  const result = await client.compliance.exportEvidence(reportId, format);
  console.log('Evidence exported:', result);
  
  return result;
}

// Verify compliance
async function verifyCompliance(auditId: string): Promise<any> {
  console.log(`Verifying compliance for audit: ${auditId}`);
  
  const verification = await client.compliance.verify(auditId);
  console.log('Compliance verification:', verification);
  
  return verification;
}

// Export compliance data
async function exportComplianceData(format: string, dateRange: any): Promise<any> {
  console.log(`Exporting compliance data as ${format}`);
  
  const result = await client.compliance.export({
    format: format,
    dateRange: dateRange
  });
  
  console.log('Compliance data exported:', result);
  
  return result;
}

// Complete compliance workflow
async function complianceWorkflow(): Promise<any> {
  console.log('=== Starting Compliance Workflow ===');
  
  // Calculate date range (last 30 days)
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  // Create compliance audit
  const audit = await createComplianceAudit(
    startDate.toISOString().split('T')[0],
    endDate.toISOString().split('T')[0],
    ['GDPR', 'SOC2']
  );
  
  // Wait for audit to complete
  console.log('Waiting for audit to complete...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Get compliance report
  const report = await getComplianceReport(audit.id);
  
  // Get compliance dashboard
  const dashboard = await getComplianceDashboard('30d');
  
  // Verify compliance
  const verification = await verifyCompliance(audit.id);
  
  // Export evidence
  await exportComplianceEvidence(audit.id, 'pdf');
  
  // Share report
  await shareComplianceReport(audit.id, [
    'compliance@company.com',
    'legal@company.com'
  ]);
  
  console.log('Compliance workflow complete');
  
  return {
    audit,
    report,
    dashboard,
    verification
  };
}

// Main execution
async function main() {
  try {
    // Run compliance workflow
    const result = await complianceWorkflow();
    
    console.log('\nWorkflow result:', {
      audit_id: result.audit.id,
      compliance_score: result.dashboard.score,
      compliant: result.verification.compliant
    });
    
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
