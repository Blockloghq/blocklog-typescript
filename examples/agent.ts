import blocklog from '@blocklog/sdk';

// Initialize the SDK
blocklog.init({
  apiKey: process.env.BLOCKLOG_API_KEY || 'test_key',
});

// A simple tool for the agent to use
class WebTools {
  @blocklog.tool({ name: 'search_web' })
  async search(query: string) {
    console.log(`Searching for: ${query}`);
    return `Results for ${query}`;
  }
}

// An agent implementation
class ResearchAgent {
  private tools = new WebTools();

  @blocklog.agent({ name: 'research-agent' })
  async run(topic: string) {
    // Perform a tool execution
    const data = await this.tools.search(topic);

    // Make a decision
    const decisionResult = await blocklog.decision({ type: 'RESEARCH_CONCLUSION' }, async (decision) => {
      decision.recordInput({ topic, data });
      
      const conclusion = { summary: `Found 100 results for ${topic}` };
      
      decision.recordOutput(conclusion);
      decision.tag('research');
      
      // Request human-in-the-loop approval if topic is sensitive
      if (topic === 'secret-project') {
        await decision.requestApproval({ reason: 'Sensitive topic research' });
      }

      return conclusion;
    });

    return decisionResult;
  }
}

async function main() {
  const agent = new ResearchAgent();
  
  console.log('Running agent...');
  const result = await agent.run('TypeScript SDKs');
  
  console.log('Result:', result);
  
  // Flush any pending telemetry manually before exit (optional)
  await blocklog.client!.flush();
}

main().catch(console.error);
