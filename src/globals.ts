import { BlocklogClient } from './client';

let globalClient: BlocklogClient | null = null;

export function setGlobalClient(client: BlocklogClient) {
  globalClient = client;
}

export function getGlobalClient(): BlocklogClient {
  if (!globalClient) {
    throw new Error('Blocklog SDK is not initialized. Call blocklog.init() first.');
  }
  return globalClient;
}
