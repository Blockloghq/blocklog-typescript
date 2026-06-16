import { BlocklogClient } from '../src/index';

// Initialize the Blocklog client
const client = new BlocklogClient({
  apiKey: process.env.BLOCKLOG_API_KEY || 'your-api-key',
  endpoint: process.env.BLOCKLOG_ENDPOINT || 'base_url',
});

// Define a calculator tool
class Calculator {
  async add(a: number, b: number): Promise<number> {
    console.log(`Calculating ${a} + ${b}...`);
    await new Promise(resolve => setTimeout(resolve, 100));
    const result = a + b;
    console.log(`Result: ${result}`);
    return result;
  }

  async multiply(a: number, b: number): Promise<number> {
    console.log(`Calculating ${a} * ${b}...`);
    await new Promise(resolve => setTimeout(resolve, 100));
    const result = a * b;
    console.log(`Result: ${result}`);
    return result;
  }

  async divide(a: number, b: number): Promise<number> {
    console.log(`Calculating ${a} / ${b}...`);
    await new Promise(resolve => setTimeout(resolve, 100));
    if (b === 0) {
      throw new Error('Division by zero');
    }
    const result = a / b;
    console.log(`Result: ${result}`);
    return result;
  }
}

// Manual tool event tracking wrapper
async function tracedToolCall(toolName: string, params: any, fn: () => Promise<any>): Promise<any> {
  const startTime = Date.now();
  
  try {
    const result = await fn();
    
    await client.event('TOOL_CALL', {
      tool_name: toolName,
      parameters: params,
      result: result,
      duration_ms: Date.now() - startTime,
      status: 'success'
    });
    
    return result;
  } catch (error) {
    await client.event('TOOL_CALL', {
      tool_name: toolName,
      parameters: params,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration_ms: Date.now() - startTime,
      status: 'error'
    });
    
    throw error;
  }
}

// Main execution
async function main() {
  try {
    const calculator = new Calculator();
    
    // Execute traced tool calls
    console.log('=== Traced Tool Calls ===');
    await tracedToolCall('calculator-add', { a: 5, b: 3 }, () => calculator.add(5, 3));
    await tracedToolCall('calculator-multiply', { a: 4, b: 7 }, () => calculator.multiply(4, 7));
    await tracedToolCall('calculator-divide', { a: 10, b: 2 }, () => calculator.divide(10, 2));
    
    // Error handling
    console.log('\n=== Error Handling ===');
    try {
      await tracedToolCall('calculator-divide', { a: 10, b: 0 }, () => calculator.divide(10, 0));
    } catch (error) {
      console.error('Expected error:', error);
    }
    
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
