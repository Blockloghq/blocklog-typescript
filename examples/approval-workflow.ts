import { BlocklogClient } from '../src/index';

// Initialize the Blocklog client
const client = new BlocklogClient({
  apiKey: process.env.BLOCKLOG_API_KEY || 'your-api-key',
  endpoint: process.env.BLOCKLOG_ENDPOINT || 'base_url',
});

// Define an approval workflow
async function requestApproval(decisionId: string, reason: string): Promise<any> {
  console.log(`Requesting approval for decision: ${decisionId}`);
  console.log('Reason:', reason);
  
  // Create approval request
  const approval = await client.approvals.create({
    decisionId: decisionId,
    reason: reason
  });
  
  console.log('Approval request created:', approval.id);
  
  return approval;
}

// Check approval status
async function checkApprovalStatus(approvalId: string): Promise<any> {
  const status = await client.approvals.status(approvalId);
  console.log('Approval status:', status);
  return status;
}

// Approve a request
async function approveRequest(approvalId: string, reason: string): Promise<any> {
  console.log(`Approving request: ${approvalId}`);
  console.log('Reason:', reason);
  
  const result = await client.approvals.approve(approvalId, reason);
  console.log('Approval result:', result);
  
  return result;
}

// Reject a request
async function rejectRequest(approvalId: string, reason: string): Promise<any> {
  console.log(`Rejecting request: ${approvalId}`);
  console.log('Reason:', reason);
  
  const result = await client.approvals.reject(approvalId, reason);
  console.log('Rejection result:', result);
  
  return result;
}

// Complete approval workflow
async function approvalWorkflow(decisionData: any): Promise<any> {
  const decisionId = `decision-${Date.now()}`;
  
  console.log('=== Starting Approval Workflow ===');
  
  // Record initial decision
  await client.event('DECISION', {
    decision_type: 'high_value_trade',
    decision_id: decisionId,
    input: decisionData,
    output: { status: 'pending_approval' },
    metadata: { requires_approval: true }
  });
  
  // Request approval
  const approval = await requestApproval(decisionId, 'High value trade requires approval');
  
  // Simulate approval process
  console.log('Waiting for approval...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Check status
  const status = await checkApprovalStatus(approval.id);
  
  // Approve or reject based on criteria
  if (decisionData.amount < 100000) {
    await approveRequest(approval.id, 'Trade meets risk criteria');
    
    // Update decision
    await client.decisions.update(decisionId, {
      output: {
        status: 'approved',
        approved_by: 'system',
        approval_reason: 'Trade meets risk criteria'
      }
    });
  } else {
    await rejectRequest(approval.id, 'Trade exceeds risk limits');
    
    // Update decision
    await client.decisions.update(decisionId, {
      output: {
        status: 'rejected',
        rejected_by: 'system',
        rejection_reason: 'Trade exceeds risk limits'
      }
    });
  }
  
  // Record final status
  const finalStatus = await checkApprovalStatus(approval.id);
  console.log('Final approval status:', finalStatus);
  
  return { decisionId, approvalId: approval.id, status: finalStatus };
}

// List pending approvals
async function listPendingApprovals(): Promise<any> {
  console.log('\n=== Listing Pending Approvals ===');
  
  const approvals = await client.approvals.list({ status: 'pending' });
  console.log('Pending approvals:', approvals);
  
  return approvals;
}

// Main execution
async function main() {
  try {
    // Run approval workflow
    const result = await approvalWorkflow({
      symbol: 'AAPL',
      action: 'BUY',
      quantity: 500,
      price: 150,
      amount: 75000
    });
    
    console.log('\nWorkflow result:', result);
    
    // List pending approvals
    await listPendingApprovals();
    
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
