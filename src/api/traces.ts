import { BaseClient } from './base';

export class TracesClient extends BaseClient {
  public async get(id: string) {
    return this.request('GET', `/traces/${id}`);
  }

  public async list(params?: Record<string, any>) {
    return this.request('GET', '/traces', { params });
  }

  public async getTimeline(id: string) {
    return this.request('GET', `/sessions/${id}/timeline`);
  }
}