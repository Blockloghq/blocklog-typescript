import { BlocklogClient } from '../client';

export class BaseClient {
  protected client: BlocklogClient;

  constructor(client: BlocklogClient) {
    this.client = client;
  }
}
