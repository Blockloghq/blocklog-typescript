import { BaseClient } from './base';

export class DecisionsClient extends BaseClient {
  public async create(data: Record<string, any>) {
    return this.client.transport.request('POST', '/decisions', { json: data });
  }

  public async get(id: string) {
    return this.client.transport.request('GET', `/decisions/${id}`);
  }

  public async list(params?: Record<string, any>) {
    return this.client.transport.request('GET', '/decisions', { params });
  }

  public async search(query: Record<string, any>) {
    return this.client.transport.request('POST', '/decisions/search', { json: query });
  }

  public async update(id: string, data: Record<string, any>) {
    return this.client.transport.request('PUT', `/decisions/${id}`, { json: data });
  }

  public async verify(id: string) {
    return this.client.transport.request('GET', `/decisions/${id}/verify`);
  }
}
