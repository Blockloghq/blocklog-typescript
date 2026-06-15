import { BlocklogClient, executeAgent } from '../src/index';
import { setGlobalClient } from '../src/globals';

// Initialize the Blocklog client
const client = new BlocklogClient({
  apiKey: process.env.BLOCKLOG_API_KEY || 'your-api-key',
  endpoint: process.env.BLOCKLOG_ENDPOINT || 'https://api.blocklog.ai',
});

// Set global client for decorator usage
setGlobalClient(client);

// Define a simple agent class
class WeatherAgent {
  async getWeather(location: string): Promise<string> {
    console.log(`Fetching weather for ${location}...`);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const weather = `Sunny in ${location}`;
    console.log(weather);
    
    return weather;
  }
}

// Using executeAgent function to trace agent execution
async function getWeatherTraced(location: string): Promise<string> {
  return await executeAgent('weather-agent', async () => {
    const agent = new WeatherAgent();
    return await agent.getWeather(location);
  });
}

// Alternative: Using executeAgent function for temperature
async function getTemperature(location: string): Promise<string> {
  return await executeAgent('temperature-agent', async () => {
    console.log(`Fetching temperature for ${location}...`);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const temp = `72°F in ${location}`;
    console.log(temp);
    
    return temp;
  });
}

// Main execution
async function main() {
  try {
    const weatherAgent = new WeatherAgent();
    
    // Execute agent with decorator
    await weatherAgent.getWeather('San Francisco');
    
    // Execute agent with function
    await getTemperature('New York');
    
    // Manual event tracking
    await client.event('MANUAL_EVENT', {
      message: 'Manual event example',
      timestamp: new Date().toISOString()
    });
    
    // Flush events
    await client.flush();
    
    // Check health
    const health = await client.health();
    console.log('Health status:', health);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Clean shutdown
    await client.shutdown();
    console.log('Client shutdown complete');
  }
}

// Run the example
main().catch(console.error);
