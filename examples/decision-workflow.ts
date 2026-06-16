import { BlocklogClient } from '../src/index';

// Initialize the Blocklog client
const client = new BlocklogClient({
  apiKey: process.env.BLOCKLOG_API_KEY || 'your-api-key',
  endpoint: process.env.BLOCKLOG_ENDPOINT || 'base_url',
});

// Define a decision workflow
async function makeDecision(decisionType: string, inputData: any): Promise<any> {
  const decisionId = `decision-${Date.now()}`;
  
  console.log(`Making decision: ${decisionType}`);
  console.log('Input:', inputData);
  
  // Record initial decision
  await client.event('DECISION', {
    decision_type: decisionType,
    decision_id: decisionId,
    input: inputData,
    output: { status: 'evaluating' },
    timestamp: new Date().toISOString(),
    metadata: {
      workflow: 'decision-workflow',
      stage: 'initial'
    }
  });
  
  // Simulate decision logic
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const output = {
    approved: inputData.amount < 10000,
    reason: inputData.amount < 10000 ? 'Within limits' : 'Requires approval',
    confidence: 0.95
  };
  
  // Record final decision
  await client.event('DECISION', {
    decision_type: decisionType,
    decision_id: decisionId,
    input: inputData,
    output: output,
    timestamp: new Date().toISOString(),
    metadata: {
      workflow: 'decision-workflow',
      stage: 'final',
      model_version: 'v1.0'
    }
  });
  
  console.log('Decision output:', output);
  
  return { decisionId, output };
}

// Trade approval decision
async function tradeApprovalDecision(trade: any): Promise<any> {
  return await makeDecision('trade_approval', {
    symbol: trade.symbol,
    action: trade.action,
    quantity: trade.quantity,
    price: trade.price,
    total_value: trade.quantity * trade.price
  });
}

// Loan approval decision
async function loanApprovalDecision(loan: any): Promise<any> {
  return await makeDecision('loan_approval', {
    applicant: loan.applicant,
    amount: loan.amount,
    credit_score: loan.creditScore,
    income: loan.income,
    debt_to_income: loan.debt_to_income
  });
}

// Using DecisionsClient for advanced operations
async function advancedDecisionWorkflow() {
  console.log('\n=== Advanced Decision Workflow ===');
  
  // Create a decision via API client
  const decision = await client.decisions.create({
    type: 'risk_assessment',
    input: { risk_level: 'high', asset_class: 'equities' },
    output: { approved: false, reason: 'High risk' },
    metadata: { automated: true }
  });
  
  console.log('Created decision:', decision);
  
  // Get the decision
  const retrieved = await client.decisions.get(decision.id);
  console.log('Retrieved decision:', retrieved);
  
  // Update the decision
  await client.decisions.update(decision.id, {
    output: { approved: true, reason: 'Approved after review' }
  });
  
  // Verify the decision
  const verification = await client.decisions.verify(decision.id);
  console.log('Verification:', verification);
  
  // Search decisions
  const searchResults = await client.decisions.search({
    type: 'risk_assessment'
  });
  console.log('Search results:', searchResults);
}

// Main execution
async function main() {
  try {
    console.log('=== Simple Decision Workflows ===');
    
    // Trade approval decision
    await tradeApprovalDecision({
      symbol: 'AAPL',
      action: 'BUY',
      quantity: 100,
      price: 150
    });
    
    // Loan approval decision
    await loanApprovalDecision({
      applicant: 'John Doe',
      amount: 50000,
      creditScore: 750,
      income: 75000,
      debt_to_income: 0.3
    });
    
    // Advanced workflow with API client
    await advancedDecisionWorkflow();
    
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
